-- Migration 016: Billing tables
-- Description: Invocation ledger and billing events for usage tracking
-- Date: 2026-05-21
-- Reversible: no

CREATE TABLE IF NOT EXISTS invocation_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  anchor_id TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  model_provider TEXT,
  model_id TEXT,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  chain_duration_ms INTEGER,
  roles_activated TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('invocation', 'storage', 'overage', 'credit', 'subscription')),
  amount_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  description TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE brain_instances
  ADD COLUMN IF NOT EXISTS billing_tier TEXT NOT NULL DEFAULT 'neuron' CHECK (billing_tier IN ('neuron', 'synapse', 'cortex', 'enterprise')),
  ADD COLUMN IF NOT EXISTS invocation_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_invocation_limit INTEGER NOT NULL DEFAULT 500;

CREATE INDEX invocation_ledger_brain_id_idx ON invocation_ledger (brain_id);
CREATE INDEX invocation_ledger_session_id_idx ON invocation_ledger (session_id);
CREATE INDEX invocation_ledger_created_at_idx ON invocation_ledger (brain_id, created_at DESC);
CREATE INDEX billing_events_brain_id_idx ON billing_events (brain_id);
CREATE INDEX billing_events_created_at_idx ON billing_events (brain_id, created_at DESC);

COMMENT ON TABLE invocation_ledger IS 'Per-invocation token usage and cost tracking.';
COMMENT ON TABLE billing_events IS 'Billing events for subscription and usage billing.';
