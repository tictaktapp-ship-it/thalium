-- Migration 008: Create api_keys table
-- Description: Stores SHA-256 hashed API keys with scopes and rate limits
-- Date: 2026-05-21
-- Reversible: no

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by TEXT
);

CREATE INDEX api_keys_brain_id_idx ON api_keys (brain_id);
CREATE INDEX api_keys_key_hash_idx ON api_keys (key_hash);
CREATE INDEX api_keys_active_idx ON api_keys (brain_id) WHERE revoked_at IS NULL;

-- Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE api_keys IS 'SHA-256 hashed API keys. Never store raw keys. Scopes enforced at application layer.';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hex digest of the raw API key. Raw key never stored.';
COMMENT ON COLUMN api_keys.scopes IS 'Array of scope strings: invoke, memory:read, memory:write, memory:admin, config:read, config:write, audit:read, admin';
