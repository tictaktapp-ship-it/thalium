-- Migration 005: Create model_registry table
-- Created: 2026-05-19
-- Reversible: no

CREATE TABLE model_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  model_id text NOT NULL,
  health_status text NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy','degraded','down')),
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  latency_p95_ms numeric NULL,
  error_rate numeric NULL CHECK (error_rate >= 0 AND error_rate <= 1)
);

CREATE INDEX model_registry_health_status_idx ON model_registry (health_status);
ALTER TABLE model_registry ENABLE ROW LEVEL SECURITY;
