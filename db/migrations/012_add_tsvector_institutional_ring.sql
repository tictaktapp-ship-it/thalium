-- Migration 012: Add tsvector full-text search to institutional_ring
-- Description: GIN index for full-text search on institutional ring content
-- Date: 2026-05-21
-- Reversible: no

ALTER TABLE institutional_ring
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content::text, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS institutional_ring_content_tsv_idx
  ON institutional_ring USING gin (content_tsv);

VACUUM ANALYZE institutional_ring;

COMMENT ON COLUMN institutional_ring.content_tsv IS 'Generated tsvector for full-text search on ring content. Updated automatically.';
