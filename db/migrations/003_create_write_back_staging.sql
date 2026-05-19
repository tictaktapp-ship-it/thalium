-- Migration 003: Create write_back_staging table
-- Created: 2026-05-19
-- Reversible: no

CREATE TABLE write_back_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  brain_id uuid NOT NULL,
  address_key ltree NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL
);

CREATE INDEX write_back_staging_brain_id_idx ON write_back_staging (brain_id);
CREATE INDEX write_back_staging_processed_at_idx ON write_back_staging (processed_at);
ALTER TABLE write_back_staging ENABLE ROW LEVEL SECURITY;
