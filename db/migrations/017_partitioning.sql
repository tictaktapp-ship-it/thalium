-- Migration 017 — Table partitioning (institutional_ring, coverage_map, audit_log)
-- Description: Drops and recreates institutional_ring and coverage_map as PARTITION BY LIST (brain_id);
--              drops and recreates audit_log as PARTITION BY RANGE (occurred_at) monthly.
--              Adds create_brain_partition() and create_audit_log_partition() helper functions.
-- Date: 2026-05-22
-- Reversible: NO — forward-only. Staging data is synthetic and will be reseeded after.
-- Prerequisites: Migrations 001-016 applied.

BEGIN;

-- ============================================================
-- STEP 1 — Drop existing tables (staging data is discardable)
-- Drop in dependency order: ring first (self-FK), then others
-- ============================================================

DROP TRIGGER IF EXISTS audit_log_immutable ON audit_log;
DROP TABLE IF EXISTS institutional_ring CASCADE;
DROP TABLE IF EXISTS coverage_map        CASCADE;
DROP TABLE IF EXISTS audit_log           CASCADE;

-- ============================================================
-- STEP 2 — institutional_ring (PARTITION BY LIST brain_id)
-- ============================================================

CREATE TABLE institutional_ring (
  id               UUID        NOT NULL DEFAULT gen_random_uuid(),
  brain_id         UUID        NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  address_key      ltree       NOT NULL,
  entry_level      TEXT        NOT NULL CHECK (entry_level IN ('root', 'branch', 'leaf')),
  content          JSONB       NOT NULL,
  confidence       NUMERIC(5,4) CHECK (confidence >= 0 AND confidence <= 1),
  source           TEXT        NOT NULL CHECK (source IN ('chain', 'direct_write', 'seeding', 'calibrator', 'reclassification')),
  superseded_by    UUID,
  refiling_count   INTEGER     NOT NULL DEFAULT 0,
  status           TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'contested', 'archived')),
  content_tsv      tsvector    GENERATED ALWAYS AS (to_tsvector('english', content::text)) STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY LIST (brain_id);

-- ============================================================
-- STEP 3 — coverage_map (PARTITION BY LIST brain_id)
-- ============================================================

CREATE TABLE coverage_map (
  brain_id         UUID        NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  address_key      ltree       NOT NULL,
  entry_count      INTEGER     NOT NULL DEFAULT 0,
  avg_confidence   NUMERIC(5,4),
  last_written_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (brain_id, address_key)
) PARTITION BY LIST (brain_id);

-- ============================================================
-- STEP 4 — audit_log (PARTITION BY RANGE occurred_at, monthly)
-- ============================================================

CREATE TABLE audit_log (
  id               UUID        NOT NULL DEFAULT gen_random_uuid(),
  brain_id         UUID        REFERENCES brain_instances(id) ON DELETE SET NULL,
  org_id           UUID,
  actor_type       TEXT        NOT NULL CHECK (actor_type IN ('chain', 'platform_user', 'api_key', 'system')),
  actor_id         TEXT,
  action           TEXT        NOT NULL,
  target_type      TEXT,
  target_id        TEXT,
  metadata         JSONB,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (occurred_at);

-- Recreate insert-only trigger on the partitioned parent
-- Trigger fires on each partition automatically (Postgres 13+)
CREATE OR REPLACE FUNCTION audit_log_immutable_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is insert-only — UPDATE and DELETE are not permitted';
END;
$$;

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable_fn();

-- ============================================================
-- STEP 5 — create_brain_partition(brain_id UUID)
-- Called synchronously from POST /v1/brain provisioning.
-- Creates institutional_ring and coverage_map partitions + indices.
-- ============================================================

CREATE OR REPLACE FUNCTION create_brain_partition(p_brain_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_short     TEXT := LEFT(REPLACE(p_brain_id::text, '-', ''), 8);
  v_ring_part TEXT := 'institutional_ring_brain_' || v_short;
  v_cmap_part TEXT := 'coverage_map_brain_'       || v_short;
BEGIN
  -- institutional_ring partition
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF institutional_ring FOR VALUES IN (%L)',
    v_ring_part, p_brain_id
  );
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I USING gist (address_key)',
    v_ring_part || '_addr_gist', v_ring_part
  );
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I USING gin (content_tsv)',
    v_ring_part || '_tsv_gin', v_ring_part
  );
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I (brain_id, superseded_by)',
    v_ring_part || '_brain_sup_idx', v_ring_part
  );
  EXECUTE format(
    'ALTER TABLE %I SET (
       autovacuum_vacuum_scale_factor  = 0.01,
       autovacuum_analyze_scale_factor = 0.005
     )', v_ring_part
  );

  -- coverage_map partition
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF coverage_map FOR VALUES IN (%L)',
    v_cmap_part, p_brain_id
  );
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I USING gist (address_key)',
    v_cmap_part || '_addr_gist', v_cmap_part
  );

  RAISE NOTICE 'Partitions created for brain_id %: % and %', p_brain_id, v_ring_part, v_cmap_part;
END;
$$;

-- ============================================================
-- STEP 6 — create_audit_log_partition(year INT, month INT)
-- Called by Consolidation Monitor 7 days before month end.
-- ============================================================

CREATE OR REPLACE FUNCTION create_audit_log_partition(p_year INT, p_month INT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_start TIMESTAMPTZ := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  v_end   TIMESTAMPTZ;
  v_name  TEXT := format('audit_log_%s_%s', p_year, LPAD(p_month::text, 2, '0'));
BEGIN
  v_end := CASE
    WHEN p_month = 12 THEN make_timestamptz(p_year + 1, 1, 1, 0, 0, 0, 'UTC')
    ELSE                   make_timestamptz(p_year, p_month + 1, 1, 0, 0, 0, 'UTC')
  END;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
    v_name, v_start, v_end
  );
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I (brain_id, occurred_at)',
    v_name || '_brain_occ_idx', v_name
  );
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I (action, occurred_at)',
    v_name || '_action_occ_idx', v_name
  );

  RAISE NOTICE 'audit_log partition created: % (% to %)', v_name, v_start, v_end;
END;
$$;

-- drop_old_audit_log_partition — safety-gated, operator-only, referenced in runbook
CREATE OR REPLACE FUNCTION drop_old_audit_log_partition(p_year INT, p_month INT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_name TEXT := format('audit_log_%s_%s', p_year, LPAD(p_month::text, 2, '0'));
  v_age  INTERVAL := now() - make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
BEGIN
  IF v_age < INTERVAL '7 years' THEN
    RAISE EXCEPTION 'Partition % is only % old — minimum retention is 7 years', v_name, v_age;
  END IF;
  EXECUTE format('DROP TABLE IF EXISTS %I', v_name);
  RAISE NOTICE 'Dropped audit_log partition: %', v_name;
END;
$$;

-- ============================================================
-- STEP 7 — Create audit_log monthly partitions
--          Current month + next 2 months
-- ============================================================

DO $$
DECLARE
  v_now   TIMESTAMPTZ := now();
  v_year  INT;
  v_month INT;
  i       INT;
BEGIN
  FOR i IN 0..2 LOOP
    v_year  := EXTRACT(YEAR  FROM v_now + (i || ' months')::INTERVAL)::INT;
    v_month := EXTRACT(MONTH FROM v_now + (i || ' months')::INTERVAL)::INT;
    PERFORM create_audit_log_partition(v_year, v_month);
  END LOOP;
END;
$$;

-- ============================================================
-- STEP 8 — RLS
-- ============================================================

ALTER TABLE institutional_ring ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_map       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================
-- POST-MIGRATION: run manually after COMMIT
-- ============================================================
-- VACUUM ANALYZE institutional_ring;
-- VACUUM ANALYZE coverage_map;
-- VACUUM ANALYZE audit_log;
