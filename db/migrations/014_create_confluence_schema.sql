-- Migration 014: Confluence schema — Brain Instance connections
-- Description: Stores connections between Brain Instances for knowledge sharing
-- Date: 2026-05-21
-- Reversible: no

CREATE TABLE IF NOT EXISTS confluence_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  target_brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'read' CHECK (connection_type IN ('read', 'bidirectional')),
  address_key_filter ltree,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_connection CHECK (source_brain_id != target_brain_id),
  CONSTRAINT unique_connection UNIQUE (source_brain_id, target_brain_id)
);

CREATE TABLE IF NOT EXISTS confluence_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES confluence_connections(id) ON DELETE CASCADE,
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('source', 'target', 'participant')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX confluence_connections_source_idx ON confluence_connections (source_brain_id) WHERE active = true;
CREATE INDEX confluence_connections_target_idx ON confluence_connections (target_brain_id) WHERE active = true;
CREATE INDEX confluence_participants_brain_id_idx ON confluence_participants (brain_id);

COMMENT ON TABLE confluence_connections IS 'Brain Instance connections for cross-instance knowledge sharing.';
