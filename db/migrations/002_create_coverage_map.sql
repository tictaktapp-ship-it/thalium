-- Migration 002: Create coverage_map table
-- Created: 2026-05-19
-- Reversible: no

CREATE TABLE coverage_map (
  brain_id uuid NOT NULL,
  address_key ltree NOT NULL,
  entry_count integer NOT NULL DEFAULT 0,
  avg_confidence numeric(5,2) NOT NULL DEFAULT 0,
  last_written_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (brain_id, address_key)
);

CREATE INDEX coverage_map_address_key_gist ON coverage_map USING gist (address_key);
CREATE INDEX coverage_map_brain_id_idx ON coverage_map (brain_id);
ALTER TABLE coverage_map ENABLE ROW LEVEL SECURITY;
