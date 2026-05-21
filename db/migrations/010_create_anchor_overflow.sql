-- Migration 010: Create anchor_overflow table
-- Description: Postgres archive for anchors evicted from Redis Shard A
-- Date: 2026-05-21
-- Reversible: no

CREATE TABLE IF NOT EXISTS anchor_overflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_id TEXT NOT NULL UNIQUE,
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  anchor_state JSONB NOT NULL,
  evicted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  chain_status TEXT NOT NULL DEFAULT 'complete' CHECK (chain_status IN ('complete', 'partial', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX anchor_overflow_anchor_id_idx ON anchor_overflow (anchor_id);
CREATE INDEX anchor_overflow_brain_id_idx ON anchor_overflow (brain_id);
CREATE INDEX anchor_overflow_session_id_idx ON anchor_overflow (session_id);
CREATE INDEX anchor_overflow_evicted_at_idx ON anchor_overflow (evicted_at DESC);

COMMENT ON TABLE anchor_overflow IS 'Postgres archive for anchors evicted from Redis Shard A. Used for audit and recovery.';
