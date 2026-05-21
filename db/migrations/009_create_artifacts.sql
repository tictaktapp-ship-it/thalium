-- Migration 009: Create artifacts table
-- Description: Stores artifact outputs from chain invocations
-- Date: 2026-05-21
-- Reversible: no

CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  anchor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  entity_id TEXT,
  address_key ltree NOT NULL,
  intent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'superseded')),
  confidence_total INTEGER,
  content JSONB NOT NULL DEFAULT '{}',
  anchor_trace JSONB,
  provenance JSONB,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX artifacts_brain_id_idx ON artifacts (brain_id);
CREATE INDEX artifacts_anchor_id_idx ON artifacts (anchor_id);
CREATE INDEX artifacts_address_key_idx ON artifacts USING gist (address_key);
CREATE INDEX artifacts_session_id_idx ON artifacts (session_id);
CREATE INDEX artifacts_entity_id_idx ON artifacts (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX artifacts_status_idx ON artifacts (brain_id, status);

ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE artifacts IS 'Artifact outputs from chain invocations. Immutable after approval.';
