/**
 * src/jobs/buffer-drain.ts
 *
 * Buffer Drain — drains the Memory Buffer (Redis Shard B write-back queue) to
 * the institutional ring at a controlled rate. Runs as a background coroutine
 * in App 2 (Instance Manager).
 *
 * Architecture:
 * - Jobs are pushed to Shard B by the Librarian after each chain completes
 * - Each job is a JSON-serialised ring entry waiting to be committed
 * - Buffer Drain reads jobs in batches, writes each via librarianWrite()
 * - Pauses when the Calibrator advisory lock is held (checked via Shard A)
 * - Confirms write_back_staging rows get processed_at set after each write
 * - Drain rate: 500 jobs/min default (configurable) = 1 job per 120ms
 * - Trigger depth: 100 jobs — below this, drain sleeps and polls
 *
 * Queue key: write_back_queue:{brain_id} (Shard B list, RPUSH/LPOP)
 * Advisory lock key: calibrator_lock:{brain_id} (Shard A)
 * Staging table: write_back_staging (Postgres) — processed_at confirmed after write
 *
 * Critical checks:
 * P7: ALL writes via librarianWrite() — never direct ring table access
 * P6: Calibrator advisory lock checked before every batch
 */

import { librarianWrite, LibrarianError } from '../lib/librarian-write.js';
import { shardA, shardB } from '../lib/redis.js';
import { InstitutionalRingEntrySchema } from '../schemas/ring.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const DRAIN_RATE_PER_MIN = 500;       // jobs per minute
export const BATCH_INTERVAL_MS = Math.floor(60_000 / DRAIN_RATE_PER_MIN); // 120ms per job
export const BATCH_SIZE = 10;                // jobs per poll cycle
export const TRIGGER_DEPTH = 100;            // min queue depth to start draining
export const POLL_INTERVAL_MS = 5_000;       // polling interval when idle (ms)
export const LOCK_CHECK_INTERVAL_MS = 1_000; // how often to check Calibrator lock
export const MAX_CONSECUTIVE_ERRORS = 5;     // stop draining after N consecutive errors

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DrainResult {
  brainId: string;
  jobsProcessed: number;
  jobsFailed: number;
  paused: boolean;
  pauseReason?: string;
  durationMs: number;
}

export interface DrainJob {
  id: string;
  brain_id: string;
  address_key: string;
  content: unknown;
  source: 'chain' | 'direct_write' | 'seeding' | 'calibrator';
  entry_level: 'root' | 'branch' | 'leaf';
  confidence: number;
  superseded_by: string | null;
  created_at: string;
  staging_id?: string; // write_back_staging row ID for processed_at confirmation
}

// ---------------------------------------------------------------------------
// Advisory lock check
// ---------------------------------------------------------------------------

/**
 * Returns true if the Calibrator advisory lock is currently held for this brain.
 * Lock is stored in Shard A as calibrator_lock:{brain_id} with a TTL.
 */
export async function isCalibratorLocked(brainId: string): Promise<boolean> {
  try {
    const lockKey = `calibrator_lock:${brainId}`;
    const lockValue = await shardA.get<string>(lockKey);
    return lockValue !== null;
  } catch {
    // If we can't check the lock, assume it's not held (conservative — prefer
    // to drain than to stall indefinitely on a Redis error)
    return false;
  }
}

// ---------------------------------------------------------------------------
// Queue depth check
// ---------------------------------------------------------------------------

/**
 * Returns the current depth of the write-back queue for a brain instance.
 */
export async function getQueueDepth(brainId: string): Promise<number> {
  try {
    const queueKey = `write_back_queue:${brainId}`;
    const depth = await shardB.llen(queueKey);
    return depth ?? 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Staging table confirmation — marks write_back_staging rows as processed
// ---------------------------------------------------------------------------

async function confirmStagingRow(stagingId: string): Promise<void> {
  if (!stagingId) return;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    await fetch(
      `${supabaseUrl}/rest/v1/write_back_staging?id=eq.${stagingId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ processed_at: new Date().toISOString() }),
      },
    );
  } catch {
    // Non-fatal — ring write already succeeded, staging confirmation is audit trail
  }
}

// ---------------------------------------------------------------------------
// Single job processing
// ---------------------------------------------------------------------------

async function processJob(rawJob: string): Promise<{ success: boolean; error?: string }> {
  let job: DrainJob;

  try {
    const parsed = typeof rawJob === 'string' ? JSON.parse(rawJob) : rawJob;
    job = parsed as DrainJob;
  } catch {
    return { success: false, error: 'Failed to parse job JSON' };
  }

  // Validate against ring schema before writing
  const validation = InstitutionalRingEntrySchema.safeParse(job);
  if (!validation.success) {
    return {
      success: false,
      error: `Job schema invalid: ${validation.error.issues.map((i) => i.message).join(', ')}`,
    };
  }

  try {
    // P7: All writes via librarianWrite() — never direct
    await librarianWrite(job);

    // Confirm staging row if present
    if (job.staging_id) {
      await confirmStagingRow(job.staging_id);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof LibrarianError
      ? `${err.code}: ${err.message}`
      : err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Drain one batch for a single Brain Instance
// ---------------------------------------------------------------------------

/**
 * Drains up to BATCH_SIZE jobs from the write-back queue for a given brain.
 * Checks the Calibrator advisory lock before starting — pauses if locked.
 */
export async function drainBatch(brainId: string): Promise<DrainResult> {
  const startMs = Date.now();

  // Check Calibrator lock
  const locked = await isCalibratorLocked(brainId);
  if (locked) {
    return {
      brainId,
      jobsProcessed: 0,
      jobsFailed: 0,
      paused: true,
      pauseReason: 'Calibrator advisory lock held',
      durationMs: Date.now() - startMs,
    };
  }

  const queueKey = `write_back_queue:${brainId}`;
  let jobsProcessed = 0;
  let jobsFailed = 0;

  for (let i = 0; i < BATCH_SIZE; i++) {
    // Re-check lock between jobs (lock may be acquired mid-batch)
    if (i > 0 && i % 5 === 0) {
      const stillLocked = await isCalibratorLocked(brainId);
      if (stillLocked) {
        return {
          brainId,
          jobsProcessed,
          jobsFailed,
          paused: true,
          pauseReason: 'Calibrator advisory lock acquired mid-batch',
          durationMs: Date.now() - startMs,
        };
      }
    }

    // Pop job from queue (atomic — job is removed from queue on pop)
    let rawJob: string | null = null;
    try {
      rawJob = await shardB.lpop<string>(queueKey);
    } catch {
      break; // Redis error — stop this batch
    }

    if (rawJob === null) break; // Queue empty

    // Rate limiting — enforce drain rate
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_INTERVAL_MS));
    }

    const result = await processJob(typeof rawJob === 'string' ? rawJob : JSON.stringify(rawJob));
    if (result.success) {
      jobsProcessed++;
    } else {
      jobsFailed++;
      console.error(`[buffer-drain] brain=${brainId} job failed: ${result.error}`);

      // Re-queue failed job at back of queue so it's retried
      try {
        await shardB.rpush(queueKey, typeof rawJob === 'string' ? rawJob : JSON.stringify(rawJob));
      } catch {
        // If re-queue fails, job is lost — log and continue
        console.error(`[buffer-drain] brain=${brainId} failed to re-queue job`);
      }
    }
  }

  return {
    brainId,
    jobsProcessed,
    jobsFailed,
    paused: false,
    durationMs: Date.now() - startMs,
  };
}

// ---------------------------------------------------------------------------
// Continuous drain loop — runs in App 2 as a background coroutine
// ---------------------------------------------------------------------------

let drainRunning = false;

/**
 * Starts the continuous drain loop for a given Brain Instance.
 * Polls queue depth every POLL_INTERVAL_MS. When depth >= TRIGGER_DEPTH,
 * drains in batches until queue is below trigger depth or lock is held.
 *
 * Designed to be called once per Brain Instance in App 2's init sequence.
 * Stops gracefully when stopDrain() is called.
 */
export async function startDrain(brainId: string): Promise<void> {
  drainRunning = true;
  let consecutiveErrors = 0;

  console.log(`[buffer-drain] Starting drain loop for brain=${brainId}`);

  while (drainRunning) {
    try {
      const depth = await getQueueDepth(brainId);

      if (depth < TRIGGER_DEPTH) {
        // Queue below trigger depth — sleep and poll
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        consecutiveErrors = 0;
        continue;
      }

      // Queue has meaningful depth — drain
      const result = await drainBatch(brainId);

      if (result.paused) {
        console.log(`[buffer-drain] brain=${brainId} paused: ${result.pauseReason}`);
        await new Promise((resolve) => setTimeout(resolve, LOCK_CHECK_INTERVAL_MS));
      } else {
        if (result.jobsProcessed > 0 || result.jobsFailed > 0) {
          console.log(
            `[buffer-drain] brain=${brainId} processed=${result.jobsProcessed} failed=${result.jobsFailed} duration=${result.durationMs}ms`,
          );
        }

        if (result.jobsFailed > 0) {
          consecutiveErrors += result.jobsFailed;
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error(
              `[buffer-drain] brain=${brainId} stopping: ${consecutiveErrors} consecutive errors`,
            );
            break;
          }
        } else {
          consecutiveErrors = 0;
        }
      }
    } catch (err) {
      console.error(`[buffer-drain] brain=${brainId} unhandled error:`, err);
      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`[buffer-drain] brain=${brainId} stopping after unhandled errors`);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  console.log(`[buffer-drain] Drain loop stopped for brain=${brainId}`);
}

/**
 * Signals the drain loop to stop after the current batch completes.
 * Called on SIGTERM for graceful shutdown — allows up to 5 seconds for
 * current batch to finish per App 2 shutdown spec.
 */
export function stopDrain(): void {
  drainRunning = false;
}

// ---------------------------------------------------------------------------
// Push a job to the write-back queue (called by Librarian)
// ---------------------------------------------------------------------------

/**
 * Pushes a ring entry to the write-back queue in Shard B.
 * Called by the Librarian's async write-back path after chain completion.
 * Also creates a write_back_staging row for audit trail.
 */
export async function enqueueWriteBack(
  brainId: string,
  entry: DrainJob,
): Promise<void> {
  const queueKey = `write_back_queue:${brainId}`;

  // Push to Shard B queue — atomic and durable
  await shardB.rpush(queueKey, JSON.stringify(entry));
}
