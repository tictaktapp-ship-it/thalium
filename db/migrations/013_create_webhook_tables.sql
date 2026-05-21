-- Migration 013: Create webhook tables
-- Description: Webhook registrations and delivery tracking
-- Date: 2026-05-21
-- Reversible: no

CREATE TABLE IF NOT EXISTS webhook_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES brain_instances(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES webhook_registrations(id) ON DELETE CASCADE,
  brain_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  response_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX webhook_registrations_brain_id_idx ON webhook_registrations (brain_id) WHERE active = true;
CREATE INDEX webhook_deliveries_registration_id_idx ON webhook_deliveries (registration_id);
CREATE INDEX webhook_deliveries_status_idx ON webhook_deliveries (status, next_retry_at) WHERE status IN ('pending', 'retrying');
CREATE INDEX webhook_deliveries_brain_id_idx ON webhook_deliveries (brain_id);

COMMENT ON TABLE webhook_registrations IS 'Subscriber webhook endpoint registrations. Secret stored as hash only.';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts with retry tracking.';
