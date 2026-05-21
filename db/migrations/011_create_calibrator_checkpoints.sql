-- Migration 011: Create calibrator_checkpoints table
-- Description: Progress checkpoints for interrupted Calibrator runs
-- Date: 2026-05-21
-- Reversible: no

CREATE TABLE IF NOT EXISTS calibrator_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  last_completed_address_key ltree,
  address_keys_remaining ltree[],
  clusters_processed INTEGER NOT NULL DEFAULT 0,
  total_clusters INTEGER NOT NULL DEFAULT 0,
  rule_weights_draft JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'complete', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_checkpoint_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX calibrator_checkpoints_brain_id_idx ON calibrator_checkpoints (brain_id);
CREATE INDEX calibrator_checkpoints_status_idx ON calibrator_checkpoints (brain_id, status) WHERE status = 'in_progress';
CREATE UNIQUE INDEX calibrator_checkpoints_run_id_idx ON calibrator_checkpoints (run_id);

COMMENT ON TABLE calibrator_checkpoints IS 'Progress checkpoints for interrupted Calibrator runs. Enables resume across consolidation windows.';
