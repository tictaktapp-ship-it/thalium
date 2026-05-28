import { Pool } from 'pg';
import { librarianWrite } from '../lib/librarian-write';
import { z } from 'zod';

const ReconsolidatorResultSchema = z.object({
  brain_id: z.string(),
  entries_processed: z.number(),
  entries_refiled: z.number(),
  entries_contested: z.number(),
  entries_skipped: z.number(),
  duration_ms: z.number(),
});

export type ReconsolidatorResult = z.infer<typeof ReconsolidatorResultSchema>;

const ENTRY_BATCH_SIZE = 50;

export async function runReconsolidator(brainId: string): Promise<ReconsolidatorResult> {
  const startTime = Date.now();
  const result: ReconsolidatorResult = {
    brain_id: brainId,
    entries_processed: 0,
    entries_refiled: 0,
    entries_contested: 0,
    entries_skipped: 0,
    duration_ms: 0,
  };

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const client = await pool.connect();

    try {
      const { rows: entries } = await client.query<{
        id: string;
        brain_id: string;
        address_key: string;
        content: unknown;
        entry_level: string;
        avg_confidence: number;
        refiling_count: number;
        refiling_history: string[];
      }>({
        text: `
          SELECT id, brain_id, address_key, content, entry_level, avg_confidence, refiling_count, refiling_history 
          FROM institutional_ring 
          WHERE brain_id = $1 AND needs_reconsolidation = true AND status != 'contested' AND refiling_count < 3 
          ORDER BY avg_confidence ASC 
          LIMIT $2
        `,
        values: [brainId, ENTRY_BATCH_SIZE],
      });

      result.entries_processed = entries.length;

      for (const entry of entries) {
        try {
          const segments = entry.address_key.split('.');
          if (segments.length !== 4) {
            console.log(JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'warn',
              component: 'reconsolidator',
              brain_id: brainId,
              message: 'Invalid address key segments',
              entry_id: entry.id,
              address_key: entry.address_key,
            }));
            result.entries_skipped++;
            continue;
          }

          const shouldSkip = entry.avg_confidence >= 0.5;
          const shouldContest = !shouldSkip && (entry.refiling_count >= 2 || segments[3] === 'general' || segments.length <= 3);
          if (shouldSkip) {
            result.entries_skipped++;
            continue;
          }
          if (shouldContest) {
            await client.query({
              text: `
                UPDATE institutional_ring 
                SET status = 'contested', needs_reconsolidation = false, updated_at = now() 
                WHERE id = $1
              `,
              values: [entry.id],
            });
            result.entries_contested++;
            continue;
          }

          const newAddressKey = `${segments[0]}.${segments[1]}.${segments[2]}.general`;
          await librarianWrite({
            brain_id: entry.brain_id,
            address_key: newAddressKey,
            content: entry.content,
            source: 'calibrator',
            entry_level: entry.entry_level,
            avg_confidence: entry.avg_confidence,
          });

          await client.query({
            text: `
              UPDATE institutional_ring 
              SET refiling_count = $1, refiling_history = array_append($2, $3::ltree), 
                  needs_reconsolidation = false, updated_at = now() 
              WHERE id = $4
            `,
            values: [
              entry.refiling_count + 1,
              entry.refiling_history,
              entry.address_key,
              entry.id,
            ],
          });

          result.entries_refiled++;
        } catch (error) {
          console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            component: 'reconsolidator',
            brain_id: brainId,
            message: 'Failed to process entry',
            entry_id: entry.id,
            error: error instanceof Error ? error.message : String(error),
          }));
          result.entries_skipped++;
        }
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'reconsolidator',
      brain_id: brainId,
      message: 'Database connection error',
      error: error instanceof Error ? error.message : String(error),
    }));
  } finally {
    await pool.end();
    result.duration_ms = Date.now() - startTime;
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    component: 'reconsolidator',
    message: 'Reconsolidation completed',
    ...result,
  }));

  return result;
}