import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { deriveWeights, applyFadeToEntries } from '../jobs/calibrator';
import { requireScope } from './routes';

const EntrySchema = z.object({
  id: z.string().min(1),
  address_key: z.string().regex(/^[a-z_]+\.(org|project|entity|global)\.[a-z0-9_]+\.\w+$/),
  content: z.record(z.unknown()),
  confidence: z.number().min(0).max(100),
  created_at: z.string().datetime({ offset: true })
});

const RequestSchema = z.object({
  entries: z.array(EntrySchema).min(1).max(500),
  memory_length: z.enum(['short', 'medium', 'long', 'permanent']).default('medium'),
  memory_style: z.enum(['precise', 'balanced', 'expansive']).default('balanced')
});

export function createCalibrateRouter(): Router {
  const router = Router();

  router.post('/v1/brain/:brainId/calibrate/dry_run', requireScope('config:write'), async (req: Request, res: Response) => {
    try {
      const brainId = req.params['brainId'] as string;
      const parsed = RequestSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: 'bad_request',
          code: 'invalid_input',
          detail: parsed.error.errors[0]?.message
        });
      }

      const { entries, memory_length, memory_style } = parsed.data;
      const fadedEntries = applyFadeToEntries(entries, memory_length, memory_style);

      const groupedEntries = new Map<string, typeof entries>();
      for (const entry of fadedEntries) {
        const group = groupedEntries.get(entry.address_key) || [];
        group.push(entry);
        groupedEntries.set(entry.address_key, group);
      }

      const clusters = Array.from(groupedEntries.entries()).map(([address_key, entries]) => {
        const weights = deriveWeights(entries);
        const avgConfidence = entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length;
        
        return {
          address_key,
          entry_count: entries.length,
          effective_count: fadedEntries.filter(e => e.address_key === address_key).length,
          derived_weights: weights,
          avg_confidence: avgConfidence
        };
      });

      return res.status(200).json({
        brain_id: brainId,
        dry_run: true,
        memory_length,
        memory_style,
        total_entries_submitted: entries.length,
        effective_entries_after_fade: fadedEntries.length,
        clusters
      });

    } catch (error) {
      console.error(JSON.stringify({
        error: 'calibration_dry_run_failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }));
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}

