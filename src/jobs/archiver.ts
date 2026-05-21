import { Pool } from 'pg';
import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ACTIVE_BRAIN_IDS: z.string().transform(s => s.split(',').map(id => id.trim()).filter(Boolean)),
});

const env = envSchema.parse(process.env);

const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
});

const ArchiverResultSchema = z.object({
  brain_id: z.string(),
  artifacts_archived: z.number().int().nonnegative(),
  ring_entries_archived: z.number().int().nonnegative(),
  duration_ms: z.number().int().nonnegative(),
});

export type ArchiverResult = z.infer<typeof ArchiverResultSchema>;

let archiverTimeout: NodeJS.Timeout | null = null;
let archiverInterval: NodeJS.Timeout | null = null;

async function logStructured(level: string, message: string, context: Record<string, unknown> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    component: 'archiver',
    message,
    ...context,
  };
  console.log(JSON.stringify(logEntry));
}

export async function runArchiverPass(brainId: string): Promise<ArchiverResult> {
  const startTime = process.hrtime.bigint();
  let artifactsArchived = 0;
  let ringEntriesArchived = 0;

  try {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Archive artifacts
      const artifactQuery = `
        UPDATE artifacts
        SET status = 'archived'
        WHERE brain_id = $1
          AND created_at < NOW() - INTERVAL '12 months'
          AND status NOT IN ('archived', 'rejected')
        RETURNING id;
      `;
      const artifactRes = await client.query(artifactQuery, [brainId]);
      artifactsArchived = artifactRes.rowCount ?? 0;

      // 2. Archive institutional_ring leaf entries
      const ringQuery = `
        UPDATE institutional_ring
        SET superseded_by = 'archived'
        WHERE brain_id = $1
          AND created_at < NOW() - INTERVAL '12 months'
          AND entry_level = 'leaf'
          AND access_count < 3
          AND superseded_by IS NULL
        RETURNING id;
      `;
      const ringRes = await client.query(ringQuery, [brainId]);
      ringEntriesArchived = ringRes.rowCount ?? 0;

      // 3. Write audit log entry
      const payload = {
        artifacts_archived: artifactsArchived,
        ring_entries_archived: ringEntriesArchived,
      };
      const auditQuery = `
        INSERT INTO audit_log (id, event_type, actor_type, actor_id, payload, created_at)
        VALUES (gen_random_uuid(), 'archive.completed', 'system', 'archiver', $1::jsonb, NOW());
      `;
      await client.query(auditQuery, [payload]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logStructured('error', `Archiver pass failed for brain ${brainId}`, { error: errorMessage });
      return {
        brain_id: brainId,
        artifacts_archived: 0,
        ring_entries_archived: 0,
        duration_ms: Number(process.hrtime.bigint() - startTime) / 1_000_000,
      };
    } finally {
      client.release();
    }
  } catch (poolError) {
    const errorMessage = poolError instanceof Error ? poolError.message : String(poolError);
    await logStructured('error', `Database connection error for archiver pass for brain ${brainId}`, { error: errorMessage });
    return {
      brain_id: brainId,
      artifacts_archived: 0,
      ring_entries_archived: 0,
      duration_ms: Number(process.hrtime.bigint() - startTime) / 1_000_000,
    };
  }

  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1_000_000;

  const result: ArchiverResult = {
    brain_id: brainId,
    artifacts_archived: artifactsArchived,
    ring_entries_archived: ringEntriesArchived,
    duration_ms: durationMs,
  };

  await logStructured('info', `Archiver pass completed for brain ${brainId}`, result);
  return result;
}

async function runArchiverForAllBrains() {
  await logStructured('info', 'Starting nightly archiver run for all active brains');
  const activeBrainIds = env.ACTIVE_BRAIN_IDS;
  const results: ArchiverResult[] = [];
  for (const brainId of activeBrainIds) {
    const result = await runArchiverPass(brainId);
    results.push(result);
  }
  await logStructured('info', 'Nightly archiver run completed', { total_brains: activeBrainIds.length, results });
}

function calculateMsUntilNext0300UTC(): number {
  const now = new Date();
  const nextRun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3, 0, 0, 0));

  if (now.getUTCHours() >= 3) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  return nextRun.getTime() - now.getTime();
}

export function startArchiver(): void {
  if (archiverTimeout || archiverInterval) {
    logStructured('warn', 'Archiver already running or scheduled. Stopping existing before starting new.');
    stopArchiver();
  }

  const msUntilNextRun = calculateMsUntilNext0300UTC();

  logStructured('info', `Archiver scheduled to start in ${msUntilNextRun} ms (next 03:00 UTC)`);

  archiverTimeout = setTimeout(() => {
    void runArchiverForAllBrains(); // Run immediately at 03:00 UTC
    archiverInterval = setInterval(() => {
      void runArchiverForAllBrains(); // Then run every 24 hours
    }, 24 * 60 * 60 * 1000);
  }, msUntilNextRun);
}

export function stopArchiver(): void {
  if (archiverTimeout) {
    clearTimeout(archiverTimeout);
    archiverTimeout = null;
    logStructured('info', 'Archiver initial timeout cleared.');
  }
  if (archiverInterval) {
    clearInterval(archiverInterval);
    archiverInterval = null;
    logStructured('info', 'Archiver daily interval cleared.');
  }
  if (!archiverTimeout && !archiverInterval) {
    logStructured('info', 'Archiver was not running or already stopped.');
  }
}

// Optional: If this file is run directly, start the archiver
if (require.main === module) {
  logStructured('info', 'Archiver script started directly. Initializing archiver.');
  startArchiver();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logStructured('info', 'Received SIGINT. Stopping archiver and exiting.');
    stopArchiver();
    pgPool.end().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    logStructured('info', 'Received SIGTERM. Stopping archiver and exiting.');
    stopArchiver();
    pgPool.end().then(() => process.exit(0));
  });
}
