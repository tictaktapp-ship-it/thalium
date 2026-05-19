-- Migration 006: Create audit_log table
-- Created: 2026-05-19
-- Reversible: no

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id uuid NOT NULL,
  session_id uuid NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_brain_id_idx ON audit_log (brain_id);
CREATE INDEX audit_log_event_type_idx ON audit_log (event_type);
CREATE INDEX audit_log_created_at_idx ON audit_log (created_at);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION audit_log_no_update_delete()
RETURNS trigger AS \$\$
BEGIN
  RAISE EXCEPTION 'audit_log is insert-only. UPDATE and DELETE are not permitted.';
END;
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_no_update_delete();
