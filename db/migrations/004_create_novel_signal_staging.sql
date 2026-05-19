-- Migration 004: Create novel_signal_staging table
-- Created: 2026-05-19
-- Reversible: no

CREATE TABLE novel_signal_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id uuid NOT NULL,
  raw_input text NOT NULL,
  prediction_error_score numeric NOT NULL CHECK (prediction_error_score >= 0 AND prediction_error_score <= 1),
  session_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  resolution text NULL
);

CREATE INDEX novel_signal_staging_brain_id_idx ON novel_signal_staging (brain_id);
CREATE INDEX novel_signal_staging_resolved_at_idx ON novel_signal_staging (resolved_at);
ALTER TABLE novel_signal_staging ENABLE ROW LEVEL SECURITY;
