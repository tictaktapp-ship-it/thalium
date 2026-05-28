import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { requireScope } from './routes';

const intentTypeSchema = z.enum([
  'specification',
  'change_request',
  'diagnosis',
  'verification',
  'risk_assessment',
  'retrospective',
  'planning',
  'knowledge_retrieval',
  'compliance_check',
  'knowledge_ingestion',
  'intent_clarification',
]);

const scopeSchema = z.enum(['org', 'project', 'entity', 'global']);

const correctClassificationSchema = z.object({
  intent_type: intentTypeSchema,
  scope: scopeSchema,
  domain: z.string().min(1),
  specificity: z.string().min(1),
  rationale: z.string().min(1),
  refile_ring_entries: z.boolean().optional(),
});

const searchMemoryQuerySchema = z.object({
  q: z.string().min(2),
  address_key_prefix: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const moveMemoryBodySchema = z.object({
  entry_id: z.string().uuid(),
  new_address_key: z.string().regex(/^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+$/),
});

const contestedMemoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const resolveMemoryBodySchema = z.object({
  action: z.enum(['approve', 'refile', 'discard']),
  new_address_key: z.string().regex(/^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+$/).optional(),
});

export function createMemoryOpsRouter(): Router {
  const router = Router();

  router.post(
    '/v1/brain/:brainId/artifacts/:artifactId/reclassify',
    requireScope('memory:write'),
    async (req: Request, res: Response) => {
      const brainId = req.params['brainId'] as string;
      const artifactId = req.params['artifactId'] as string;
      const pool = req.app.get('pgPool') as Pool;

      const parseResult = correctClassificationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parseResult.error.errors });
      }
      const { intent_type, scope, domain, specificity, rationale, refile_ring_entries } = parseResult.data;

      try {
        const artifactResult = await pool.query(
          `SELECT id, brain_id, address_key, anchor_id FROM artifacts WHERE id = $1 AND brain_id = $2`,
          [artifactId, brainId]
        );

        if (artifactResult.rows.length === 0) {
          return res.status(404).json({ error: 'Artifact not found' });
        }

        const artifact = artifactResult.rows[0];
        const oldAddressKey = artifact.address_key;
        const new_address_key = `${intent_type}.${scope}.${domain}.${specificity}`;
        let ringEntriesFlagged = false;

        if (refile_ring_entries) {
          await pool.query(
            `UPDATE institutional_ring SET needs_reconsolidation = TRUE WHERE anchor_id = $1 AND brain_id = $2`,
            [artifact.anchor_id, brainId]
          );
          ringEntriesFlagged = true;
        }

        await pool.query(
          `INSERT INTO audit_log (brain_id, entity_id, entity_type, action, details) VALUES ($1, $2, $3, $4, $5)`,
          [
            brainId,
            artifactId,
            'artifact',
            'reclassify',
            { old_address_key: oldAddressKey, new_address_key: new_address_key, rationale, refile_ring_entries },
          ]
        );

        return res.status(200).json({
          artifact_id: artifactId,
          old_address_key: oldAddressKey,
          new_address_key: new_address_key,
          ring_entries_flagged: ringEntriesFlagged,
        });
      } catch (error) {
        console.error('Error reclassifying artifact:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  router.get(
    '/v1/brain/:brainId/memory/search',
    requireScope('memory:read'),
    async (req: Request, res: Response) => {
      const brainId = req.params['brainId'] as string;
      const pool = req.app.get('pgPool') as Pool;

      const parseResult = searchMemoryQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: parseResult.error.errors });
      }
      const { q, address_key_prefix, limit, offset } = parseResult.data;

      try {
        let query = `
          SELECT id, address_key::text, content, avg_confidence, created_at, source, anchor_id
          FROM institutional_ring
          WHERE brain_id = $1 AND superseded_by IS NULL AND content_tsv @@ plainto_tsquery('english', $2)
        `;
        let countQuery = `
          SELECT COUNT(id)
          FROM institutional_ring
          WHERE brain_id = $1 AND superseded_by IS NULL AND content_tsv @@ plainto_tsquery('english', $2)
        `;
        const params: (string | number)[] = [brainId, q];
        let paramIndex = 3;

        if (address_key_prefix) {
          query += ` AND address_key <@ $${paramIndex}`;
          countQuery += ` AND address_key <@ $${paramIndex}`;
          params.push(address_key_prefix);
          paramIndex++;
        }

        query += ` ORDER BY ts_rank(content_tsv, plainto_tsquery('english', $2)) DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const resultsPromise = pool.query(query, params);
        const totalCountPromise = pool.query(countQuery, [brainId, q, ...(address_key_prefix ? [address_key_prefix] : [])]);

        const [results, totalCountResult] = await Promise.all([resultsPromise, totalCountPromise]);

        return res.status(200).json({
          results: results.rows,
          total: parseInt(totalCountResult.rows[0].count, 10),
          query: q,
          address_key_filter: address_key_prefix,
        });
      } catch (error) {
        console.error('Error searching memory:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  router.post(
    '/v1/brain/:brainId/memory/move',
    requireScope('memory:admin'),
    async (req: Request, res: Response) => {
      const brainId = req.params['brainId'] as string;
      const pool = req.app.get('pgPool') as Pool;

      const parseResult = moveMemoryBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parseResult.error.errors });
      }
      const { entry_id, new_address_key } = parseResult.data;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const entryResult = await client.query(
          `SELECT id, brain_id, address_key, content, avg_confidence, created_at, source, anchor_id, metadata, status, superseded_by, needs_reconsolidation, refiling_count
           FROM institutional_ring WHERE id = $1 AND brain_id = $2`,
          [entry_id, brainId]
        );

        if (entryResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Memory entry not found' });
        }

        const oldEntry = entryResult.rows[0];
        const oldAddressKey = oldEntry.address_key;

        // Supersede the old entry
        const supersededByUuid = await client.query(`SELECT gen_random_uuid()::text as uuid`);
        await client.query(
          `UPDATE institutional_ring SET superseded_by = $1 WHERE id = $2`,
          [supersededByUuid.rows[0].uuid, entry_id]
        );

        // Insert a new entry with the new address key
        const newEntryResult = await client.query(
          `INSERT INTO institutional_ring (brain_id, address_key, content, avg_confidence, created_at, source, anchor_id, metadata, status, superseded_by, needs_reconsolidation, refiling_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            oldEntry.brain_id,
            new_address_key,
            oldEntry.content,
            oldEntry.avg_confidence,
            oldEntry.created_at,
            'direct_write', // Source for the new entry
            oldEntry.anchor_id,
            oldEntry.metadata,
            oldEntry.status,
            null, // New entry is not superseded
            false, // New entry does not need reconsolidation initially
            0, // Reset refiling count for the new entry
          ]
        );
        const newEntryId = newEntryResult.rows[0].id;

        await client.query(
          `INSERT INTO audit_log (brain_id, entity_id, entity_type, action, details) VALUES ($1, $2, $3, $4, $5)`,
          [
            brainId,
            entry_id,
            'institutional_ring_entry',
            'move',
            { old_entry_id: entry_id, new_entry_id: newEntryId, old_address_key: oldAddressKey, new_address_key: new_address_key },
          ]
        );

        await client.query('COMMIT');
        return res.status(200).json({
          old_entry_id: entry_id,
          new_entry_id: newEntryId,
          old_address_key: oldAddressKey,
          new_address_key: new_address_key,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error moving memory entry:', error);
        return res.status(500).json({ error: 'Internal server error' });
      } finally {
        client.release();
      }
    }
  );

  router.get(
    '/v1/brain/:brainId/memory/contested',
    requireScope('memory:read'),
    async (req: Request, res: Response) => {
      const brainId = req.params['brainId'] as string;
      const pool = req.app.get('pgPool') as Pool;

      const parseResult = contestedMemoryQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: parseResult.error.errors });
      }
      const { limit, offset } = parseResult.data;

      try {
        const entriesResult = await pool.query(
          `SELECT id, address_key::text, content, avg_confidence, created_at, source, anchor_id, refiling_count
           FROM institutional_ring
           WHERE brain_id = $1 AND superseded_by IS NULL AND refiling_count > 0
           ORDER BY refiling_count DESC
           LIMIT $2 OFFSET $3`,
          [brainId, limit, offset]
        );

        const totalCountResult = await pool.query(
          `SELECT COUNT(id)
           FROM institutional_ring
           WHERE brain_id = $1 AND superseded_by IS NULL AND refiling_count > 0`,
          [brainId]
        );

        return res.status(200).json({
          entries: entriesResult.rows,
          total: parseInt(totalCountResult.rows[0].count, 10),
          limit,
          offset,
        });
      } catch (error) {
        console.error('Error fetching contested memory entries:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  router.post(
    '/v1/brain/:brainId/memory/:entryId/resolve',
    requireScope('memory:write'),
    async (req: Request, res: Response) => {
      const brainId = req.params['brainId'] as string;
      const entryId = req.params['entryId'] as string;
      const pool = req.app.get('pgPool') as Pool;

      const parseResult = resolveMemoryBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parseResult.error.errors });
      }
      const { action, new_address_key } = parseResult.data;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const entryResult = await client.query(
          `SELECT id, brain_id, address_key, refiling_count FROM institutional_ring WHERE id = $1 AND brain_id = $2 AND superseded_by IS NULL`,
          [entryId, brainId]
        );

        if (entryResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Contested memory entry not found or already resolved' });
        }

        const oldAddressKey = entryResult.rows[0].address_key;
        let updateQuery = '';
        let updateParams: (string | boolean | null)[] = [];
        let auditDetails: Record<string, any> = { action };

        switch (action) {
          case 'approve':
            updateQuery = `UPDATE institutional_ring SET status = 'active', refiling_count = 0 WHERE id = $1`;
            updateParams = [entryId];
            break;
          case 'refile':
            if (!new_address_key) {
              await client.query('ROLLBACK');
              return res.status(400).json({ error: 'new_address_key is required for refile action' });
            }
            updateQuery = `UPDATE institutional_ring SET address_key = $1, status = 'active', refiling_count = 0 WHERE id = $2`;
            updateParams = [new_address_key, entryId];
            auditDetails = { ...auditDetails, old_address_key: oldAddressKey, new_address_key };
            break;
          case 'discard':
            updateQuery = `UPDATE institutional_ring SET superseded_by = 'discarded', status = 'discarded', refiling_count = 0 WHERE id = $1`;
            updateParams = [entryId];
            break;
        }

        await client.query(updateQuery, updateParams);

        await client.query(
          `INSERT INTO audit_log (brain_id, entity_id, entity_type, action, details) VALUES ($1, $2, $3, $4, $5)`,
          [brainId, entryId, 'institutional_ring_entry', `resolve_${action}`, auditDetails]
        );

        await client.query('COMMIT');
        return res.status(200).json({ entry_id: entryId, action, status: 'resolved' });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error resolving memory entry:', error);
        return res.status(500).json({ error: 'Internal server error' });
      } finally {
        client.release();
      }
    }
  );

  return router;
}
