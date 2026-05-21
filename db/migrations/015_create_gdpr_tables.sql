-- Migration 015: GDPR erasure and pseudonymisation
-- Description: Erasure log, organisation pseudonymisation keys, archive index
-- Date: 2026-05-21
-- Reversible: no

CREATE TABLE IF NOT EXISTS erasure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'failed')),
  entries_erased INTEGER NOT NULL DEFAULT 0,
  artifacts_erased INTEGER NOT NULL DEFAULT 0,
  requested_by TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS organisation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  key_version INTEGER NOT NULL DEFAULT 1,
  key_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  CONSTRAINT unique_active_key UNIQUE (brain_id, key_version)
);

CREATE TABLE IF NOT EXISTS archive_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('ring_entry', 'artifact', 'anchor')),
  original_id TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  storage_path TEXT,
  checksum TEXT
);

CREATE INDEX erasure_log_brain_id_idx ON erasure_log (brain_id);
CREATE INDEX erasure_log_entity_id_idx ON erasure_log (entity_id);
CREATE INDEX erasure_log_status_idx ON erasure_log (status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX organisation_keys_brain_id_idx ON organisation_keys (brain_id) WHERE active = true;
CREATE INDEX archive_index_brain_id_idx ON archive_index (brain_id);
CREATE INDEX archive_index_original_id_idx ON archive_index (original_id);

ALTER TABLE erasure_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE erasure_log IS 'GDPR erasure requests and completion status. Insert-only via trigger.';
COMMENT ON TABLE organisation_keys IS 'Pseudonymisation keys per Brain Instance for GDPR compliance.';
