-- Migration 007: Create brain_instances table
-- Created: 2026-05-19
-- Reversible: no

CREATE TABLE brain_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  region text NOT NULL CHECK (region IN ('us-east-1','us-west-2','eu-west-1','ap-southeast-1')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX brain_instances_subscriber_id_idx ON brain_instances (subscriber_id);
CREATE INDEX brain_instances_status_idx ON brain_instances (status);
ALTER TABLE brain_instances ENABLE ROW LEVEL SECURITY;
