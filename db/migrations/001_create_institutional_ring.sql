-- Migration 001: Create institutional_ring table
-- Created: 2026-05-19
-- Reversible: no

CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE institutional_ring (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brain_id uuid NOT NULL,
    address_key ltree NOT NULL,
    content jsonb NOT NULL,
    source text NOT NULL CHECK (source IN ('chain', 'direct_write', 'seeding', 'calibrator')),
    entry_level text NOT NULL CHECK (entry_level IN ('root', 'branch', 'leaf')),
    confidence numeric(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    superseded_by uuid REFERENCES institutional_ring(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX institutional_ring_address_key_gist ON institutional_ring USING gist (address_key);
CREATE INDEX institutional_ring_brain_id_idx ON institutional_ring (brain_id);

ALTER TABLE institutional_ring ENABLE ROW LEVEL SECURITY;

VACUUM ANALYZE institutional_ring;

-- Migration 001: Create institutional_ring table
-- Created: 2026-05-19
-- Reversible: no

CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE institutional_ring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id uuid NOT NULL,
  address_key ltree NOT NULL,
  content jsonb NOT NULL,
  source text NOT NULL CHECK (source IN ('chain','direct_write','seeding','calibrator')),
  entry_level text NOT NULL CHECK (entry_level IN ('root','branch','leaf')),
  confidence numeric(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  superseded_by uuid REFERENCES institutional_ring(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX institutional_ring_address_key_gist ON institutional_ring USING gist (address_key);
CREATE INDEX institutional_ring_brain_id_idx ON institutional_ring (brain_id);
ALTER TABLE institutional_ring ENABLE ROW LEVEL SECURITY;
VACUUM ANALYZE institutional_ring;