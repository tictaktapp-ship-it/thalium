import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { librarianWrite } from '../lib/librarian-write';
import { requireScope } from './routes';

const OutcomeSchema = z.object({
  outcome_type: z.enum(['success', 'failure', 'partial', 'override']),
  outcome_score: z.number().min(0).max(100),
  outcome_notes: z.string().max(1000).optional(),
  corrected_content: z.record(z.unknown()).optional(),
});

export async function outcomeHandler(req: Request, res: Response): Promise<void> {
  try {
    const { brainId, artifactId } = req.params;
    const body = OutcomeSchema.parse(req.body);

    const pgPool: Pool = req.app.get('pgPool');
    const redisShardC: Redis = req.app.get('redisShardC');

    // Step 1: Look up artifact
    const artifactQuery = await pgPool.query<{
      id: string;
      brain_id: string;
      address_key: string;
      anchor_id: string;
    }>(
      'SELECT id, brain_id, address_key, anchor_id FROM artifacts WHERE id = $1 AND brain_id = $2',
      [artifactId, brainId]
    );

    if (!artifactQuery.rows.length) {
      res.status(404).json({ error: 'not_found', code: 'artifact_not_found' });
      return;
    }

    const artifact = artifactQuery.rows[0];
    if (!artifact) {
      res.status(404).json({ error: 'not_found', code: 'artifact_not_found' });
      return;
    }

    // Step 2: Write to institutional ring
    const ringEntry = await librarianWrite({
      address_key: artifact.address_key,
      content: {
        artifact_id: artifactId,
        outcome_type: body.outcome_type,
        outcome_score: body.outcome_score,
        outcome_notes: body.outcome_notes,
        corrected_content: body.corrected_content,
        recorded_at: new Date().toISOString(),
      },
      source: 'outcome',
      entry_level: 'leaf',
      avg_confidence: body.outcome_score / 100,
      brain_id: brainId,
    });

    // Step 3: Update Coverage Map (non-critical)
    try {
      const coverageKey = `coverage_map:${brainId}:${artifact.address_key}`;
      const existing = await redisShardC.get<Record<string, unknown>>(coverageKey);
      const entryCount = typeof existing?.entry_count === 'number' ? existing.entry_count + 1 : 1;
      const updated = existing && typeof existing === 'object' ? { ...existing, entry_count: entryCount } : { entry_count: entryCount };
      await redisShardC.set(coverageKey, JSON.stringify(updated), { ex: 3600 });
    } catch (coverageError) {
      console.error('Coverage map update failed', { error: coverageError, brainId, address_key: artifact.address_key });
    }

    // Step 4: Flag for reconsolidation if needed
    let reconsolidationFlagged = false;
    if (body.outcome_type === 'failure' || body.outcome_type === 'override') {
      await pgPool.query(
        'UPDATE institutional_ring SET needs_reconsolidation = true WHERE anchor_id = $1 AND brain_id = $2',
        [artifact.anchor_id, brainId]
      );
      reconsolidationFlagged = true;
    }

    // Step 5: Write audit log (non-critical)
    try {
      await pgPool.query(
        'INSERT INTO audit_log (id, brain_id, event_type, actor_type, actor_id, payload, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())',
        [
          brainId,
          'outcome.recorded',
          'api_key',
          req.apiKey ?? 'unknown',
          JSON.stringify({
            artifact_id: artifactId,
            outcome_type: body.outcome_type,
            outcome_score: body.outcome_score,
            address_key: artifact.address_key,
          }),
        ]
      );
    } catch (auditError) {
      console.error('Audit log write failed', { error: auditError, brainId, artifactId });
    }

    res.status(200).json({
      artifact_id: artifactId,
      outcome_type: body.outcome_type,
      outcome_score: body.outcome_score,
      ring_entry_id: ringEntry.id,
      reconsolidation_flagged: reconsolidationFlagged,
      audit_log_entry: 'written',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'bad_request',
        code: 'invalid_input',
        detail: err.errors[0]?.message,
      });
      return;
    }

    console.error('Outcome recording failed', { error: err });
    res.status(500).json({ error: 'internal_error', code: 'ring_write_failed' });
  }
}

export function createOutcomeRouter(): Router {
  const router = Router();
  router.post('/v1/brain/:brainId/artifacts/:artifactId/outcome', requireScope('memory:write'), outcomeHandler);
  return router;
}