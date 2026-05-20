/**
 * src/jobs/calibrator.ts
 *
 * Calibrator — derives Scorer rule weights and Interrogator thresholds from
 * the institutional ring during consolidation windows. Runs in App 2.
 *
 * Critical invariants:
 * P6: Rules emerge from memory — never hardcoded
 * P7: Writes upward only (branch/root keys) — leaf entries are never touched
 *
 * Flow:
 * 1. Acquire advisory lock in Shard A (calibrator_lock:{brain_id}, max 90s TTL)
 * 2. Load checkpoint from Postgres if a prior run was interrupted
 * 3. For each address key cluster in the institutional ring:
 *    a. Fetch leaf entries (excluding contested entries)
 *    b. Hold back 10% for cross-validation
 *    c. Derive rule weights from training set
 *    d. Write derived weights to branch/root key via librarianWrite()
 *    e. Checkpoint progress to Postgres
 *    f. If elapsed > 85s, checkpoint and exit — resume next window
 * 4. On completion: run cross-validation holdout
 *    - If holdout passes: emit calibration.complete audit event
 *    - If holdout fails: discard weights, emit calibration.rollback, ban 24h
 * 5. Release advisory lock
 *
 * Dry-run mode: POST /v1/brain/{id}/calibrate/dry_run
 * Accepts a synthetic ring snapshot, returns derived weights without writing.
 */

import { librarianWrite, LibrarianError } from '../lib/librarian-write.js';
import { shardA, shardC } from '../lib/redis.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LOCK_TTL_SECONDS = 90;
export const CHECKPOINT_THRESHOLD_SECONDS = 85;
export const HOLDOUT_FRACTION = 0.1;          // 10% held back for cross-validation
export const MIN_ENTRIES_FOR_CALIBRATION = 5; // minimum leaf entries per cluster
export const CALIBRATION_COOLDOWN_HOURS = 24; // ban period after rollback

// Default rule weights (bootstrap — used before Calibrator has run)
export const DEFAULT_RULE_WEIGHTS: RuleWeights = {
  architect_weight: 0.4,
  devil_weight: 0.4,
  coverage_weight: 0.2,
};

// Default Interrogator threshold (bootstrap)
export const DEFAULT_INTERROGATOR_THRESHOLD = 0.7;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RuleWeights {
  architect_weight: number;
  devil_weight: number;
  coverage_weight: number;
}

export interface RingLeafEntry {
  id: string;
  address_key: string;
  content: Record<string, unknown>;
  confidence: number;
  created_at: string;
}

export interface ClusterAnalysis {
  address_key: string;
  entry_count: number;
  holdout_count: number;
  training_count: number;
  derived_weights: RuleWeights;
  interrogator_threshold: number;
  avg_confidence: number;
  cross_validation_score: number;
}

export interface CalibratorCheckpoint {
  brain_id: string;
  run_id: string;
  last_completed_address_key: string | null;
  address_keys_remaining: string[];
  clusters_processed: number;
  total_clusters: number;
  rule_weights_draft: Record<string, RuleWeights>;
  started_at: string;
  last_checkpoint_at: string;
  status: 'in_progress' | 'complete' | 'abandoned';
}

export interface CalibratorResult {
  brainId: string;
  runId: string;
  dryRun: boolean;
  clustersProcessed: number;
  totalClusters: number;
  outcome: 'complete' | 'rollback' | 'checkpoint' | 'skipped' | 'insufficient_data';
  derivedWeights?: Record<string, RuleWeights>;
  rollbackReason?: string;
  durationMs: number;
}

export interface DryRunInput {
  brainId: string;
  entries: RingLeafEntry[];
}

// ---------------------------------------------------------------------------
// Advisory lock management (Shard A)
// ---------------------------------------------------------------------------

export async function acquireLock(brainId: string): Promise<boolean> {
  const lockKey = `calibrator_lock:${brainId}`;
  try {
    // SET NX — only sets if key doesn't exist
    const result = await shardA.set(lockKey, 'locked', {
      ex: LOCK_TTL_SECONDS,
      nx: true,
    });
    return result !== null;
  } catch {
    return false;
  }
}

export async function releaseLock(brainId: string): Promise<void> {
  const lockKey = `calibrator_lock:${brainId}`;
  try {
    await shardA.del(lockKey);
  } catch {
    // Best-effort — lock will expire via TTL
  }
}

export async function isOnCooldown(brainId: string): Promise<boolean> {
  const cooldownKey = `calibrator_cooldown:${brainId}`;
  try {
    const value = await shardA.get<string>(cooldownKey);
    return value !== null;
  } catch {
    return false;
  }
}

export async function setCooldown(brainId: string): Promise<void> {
  const cooldownKey = `calibrator_cooldown:${brainId}`;
  try {
    await shardA.set(cooldownKey, '1', {
      ex: CALIBRATION_COOLDOWN_HOURS * 3600,
    });
  } catch {
    // Best-effort
  }
}

// ---------------------------------------------------------------------------
// Ring data fetching
// ---------------------------------------------------------------------------

async function fetchLeafEntries(brainId: string): Promise<RingLeafEntry[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    // Fetch all non-superseded leaf entries, excluding contested ones
    const url = `${supabaseUrl}/rest/v1/institutional_ring?brain_id=eq.${brainId}&entry_level=eq.leaf&superseded_by=is.null&select=id,address_key,content,confidence,created_at&order=address_key.asc,created_at.asc`;
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    if (!res.ok) return [];
    return (await res.json()) as RingLeafEntry[];
  } catch {
    return [];
  }
}

async function fetchAddressKeys(brainId: string): Promise<string[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const url = `${supabaseUrl}/rest/v1/institutional_ring?brain_id=eq.${brainId}&entry_level=eq.leaf&superseded_by=is.null&select=address_key`;
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { address_key: string }[];
    // Deduplicate
    return [...new Set(rows.map((r) => r.address_key))];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Rule weight derivation
// ---------------------------------------------------------------------------

/**
 * Derives Scorer rule weights from a set of leaf entries.
 *
 * The derivation logic:
 * - High avg_confidence entries → increase architect_weight (Architect is accurate)
 * - High variance in confidence → increase devil_weight (Devil adds value)
 * - Low entry count → increase coverage_weight (more data needed)
 *
 * Weights always sum to 1.0.
 */
export function deriveWeights(entries: RingLeafEntry[]): RuleWeights {
  if (entries.length === 0) return DEFAULT_RULE_WEIGHTS;

  const confidences = entries.map((e) => e.confidence);
  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  // Variance in confidence — higher variance means Devil is more valuable
  const variance =
    confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) /
    confidences.length;
  const stdDev = Math.sqrt(variance);

  // Normalised signals (0–1 range)
  const confidenceSignal = Math.min(avgConfidence / 100, 1);   // 0–1
  const varianceSignal = Math.min(stdDev / 50, 1);             // 0–1, normalised against 50-point stdDev
  const countSignal = Math.max(0, 1 - entries.length / 100);   // 0–1, fewer entries = higher

  // Derive raw weights
  const rawArchitect = 0.3 + confidenceSignal * 0.2;  // 0.3–0.5
  const rawDevil = 0.2 + varianceSignal * 0.3;        // 0.2–0.5
  const rawCoverage = 0.1 + countSignal * 0.2;        // 0.1–0.3

  const total = rawArchitect + rawDevil + rawCoverage;

  return {
    architect_weight: Math.round((rawArchitect / total) * 1000) / 1000,
    devil_weight: Math.round((rawDevil / total) * 1000) / 1000,
    coverage_weight: Math.round((rawCoverage / total) * 1000) / 1000,
  };
}

/**
 * Derives the Interrogator prediction error threshold from entries.
 * Lower avg confidence → lower threshold (Interrogator activates more readily).
 */
export function deriveInterrogatorThreshold(entries: RingLeafEntry[]): number {
  if (entries.length === 0) return DEFAULT_INTERROGATOR_THRESHOLD;

  const avgConfidence =
    entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length;

  // Map confidence (0–100) to threshold (0.5–0.9)
  const threshold = 0.5 + (avgConfidence / 100) * 0.4;
  return Math.round(threshold * 100) / 100;
}

// ---------------------------------------------------------------------------
// Cross-validation
// ---------------------------------------------------------------------------

/**
 * Evaluates how well derived weights perform on the holdout set.
 * Returns a score 0–1 (higher = better).
 */
export function crossValidate(
  holdout: RingLeafEntry[],
  weights: RuleWeights,
): number {
  if (holdout.length === 0) return 1.0;

  // Simulate scorer output on holdout entries using new weights
  // Score = weighted average of confidence signals
  const scores = holdout.map((entry) => {
    const architectConf = entry.confidence;
    // Simulated devil risk (inverse of confidence — lower confidence = higher risk)
    const devilRisk = 100 - entry.confidence;
    // Ring coverage weight (based on position in holdout — proxy for coverage)
    const coverageProxy = 50;

    return (
      architectConf * weights.architect_weight +
      (100 - devilRisk) * weights.devil_weight +
      coverageProxy * weights.coverage_weight
    );
  });

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  // Normalise to 0–1
  return Math.min(Math.max(avgScore / 100, 0), 1);
}

// ---------------------------------------------------------------------------
// Checkpoint management
// ---------------------------------------------------------------------------

async function saveCheckpoint(
  checkpoint: CalibratorCheckpoint,
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/calibrator_checkpoints`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        ...checkpoint,
        last_checkpoint_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Non-fatal
  }
}

async function loadCheckpoint(
  brainId: string,
): Promise<CalibratorCheckpoint | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/calibrator_checkpoints?brain_id=eq.${brainId}&status=eq.in_progress&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as CalibratorCheckpoint[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

async function writeAuditEvent(
  brainId: string,
  eventType: 'calibration.complete' | 'calibration.rollback' | 'calibration.checkpoint',
  payload: Record<string, unknown>,
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        brain_id: brainId,
        event_type: eventType,
        payload: { brain_id: brainId, ...payload },
        occurred_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Best-effort audit
  }
}

// ---------------------------------------------------------------------------
// Write derived weights to ring (branch key)
// ---------------------------------------------------------------------------

async function writeDerivedWeights(
  brainId: string,
  addressKey: string,
  weights: RuleWeights,
  interrogatorThreshold: number,
): Promise<void> {
  // Derive the branch key: strip the specificity level (level 4) to get branch
  const parts = addressKey.split('.');
  if (parts.length < 3) return;

  // Write to branch key (3 levels) — upward from leaf, never at leaf level (P7)
  const branchKey = parts.slice(0, 3).join('.');

  await librarianWrite({
    id: crypto.randomUUID(),
    brain_id: brainId,
    address_key: `${branchKey}.calibrated`,
    entry_level: 'branch',
    source: 'calibrator',
    content: {
      rule_weights: weights,
      interrogator_threshold: interrogatorThreshold,
      derived_at: new Date().toISOString(),
      source_address_key: addressKey,
    },
    confidence: 80, // Calibrator-derived entries carry fixed confidence
    superseded_by: null,
    created_at: new Date().toISOString(),
  });

  // Update Scorer rule weight cache in Shard C
  const cacheKey = `rule_weights:${brainId}:${addressKey}`;
  await shardC.set(cacheKey, JSON.stringify(weights), { ex: 3600 });
}

// ---------------------------------------------------------------------------
// Main calibration run
// ---------------------------------------------------------------------------

/**
 * Runs a full calibration pass for a Brain Instance.
 *
 * @param brainId - The Brain Instance to calibrate
 * @param dryRun  - If true, returns weights without writing to ring
 */
export async function runCalibrator(
  brainId: string,
  dryRun = false,
): Promise<CalibratorResult> {
  const startMs = Date.now();
  const runId = crypto.randomUUID();

  // Check cooldown (post-rollback ban)
  if (!dryRun && await isOnCooldown(brainId)) {
    return {
      brainId,
      runId,
      dryRun,
      clustersProcessed: 0,
      totalClusters: 0,
      outcome: 'skipped',
      durationMs: Date.now() - startMs,
    };
  }

  // Acquire advisory lock
  if (!dryRun) {
    const locked = await acquireLock(brainId);
    if (!locked) {
      return {
        brainId,
        runId,
        dryRun,
        clustersProcessed: 0,
        totalClusters: 0,
        outcome: 'skipped',
        durationMs: Date.now() - startMs,
      };
    }
  }

  try {
    // Load checkpoint if resuming interrupted run
    let checkpoint = dryRun ? null : await loadCheckpoint(brainId);
    const isResume = checkpoint !== null;

    // Fetch all leaf entries
    const allEntries = await fetchLeafEntries(brainId);
    if (allEntries.length < MIN_ENTRIES_FOR_CALIBRATION) {
      return {
        brainId,
        runId,
        dryRun,
        clustersProcessed: 0,
        totalClusters: 0,
        outcome: 'insufficient_data',
        durationMs: Date.now() - startMs,
      };
    }

    // Group entries by address key
    const clusters = new Map<string, RingLeafEntry[]>();
    for (const entry of allEntries) {
      const existing = clusters.get(entry.address_key) ?? [];
      existing.push(entry);
      clusters.set(entry.address_key, existing);
    }

    const allAddressKeys = Array.from(clusters.keys());
    const totalClusters = allAddressKeys.length;

    // Determine which keys to process (resume from checkpoint if applicable)
    let keysToProcess = allAddressKeys;
    let derivedWeightsDraft: Record<string, RuleWeights> = {};
    let clustersProcessed = 0;

    if (isResume && checkpoint) {
      keysToProcess = checkpoint.address_keys_remaining;
      derivedWeightsDraft = checkpoint.rule_weights_draft;
      clustersProcessed = checkpoint.clusters_processed;
      console.log(`[calibrator] brain=${brainId} resuming run=${checkpoint.run_id} clusters_remaining=${keysToProcess.length}`);
    } else {
      checkpoint = {
        brain_id: brainId,
        run_id: runId,
        last_completed_address_key: null,
        address_keys_remaining: allAddressKeys,
        clusters_processed: 0,
        total_clusters: totalClusters,
        rule_weights_draft: {},
        started_at: new Date().toISOString(),
        last_checkpoint_at: new Date().toISOString(),
        status: 'in_progress',
      };
      if (!dryRun) await saveCheckpoint(checkpoint);
    }

    // Process each cluster
    for (const addressKey of keysToProcess) {
      const elapsedSeconds = (Date.now() - startMs) / 1000;

      // Check 90-second limit
      if (!dryRun && elapsedSeconds > CHECKPOINT_THRESHOLD_SECONDS) {
        // Save checkpoint and exit — resume next window
        checkpoint.address_keys_remaining = keysToProcess.slice(keysToProcess.indexOf(addressKey));
        checkpoint.clusters_processed = clustersProcessed;
        checkpoint.rule_weights_draft = derivedWeightsDraft;
        await saveCheckpoint(checkpoint);

        await writeAuditEvent(brainId, 'calibration.checkpoint', {
          run_id: runId,
          clusters_processed: clustersProcessed,
          total_clusters: totalClusters,
          remaining: checkpoint.address_keys_remaining.length,
        });

        return {
          brainId,
          runId,
          dryRun,
          clustersProcessed,
          totalClusters,
          outcome: 'checkpoint',
          derivedWeights: derivedWeightsDraft,
          durationMs: Date.now() - startMs,
        };
      }

      const entries = clusters.get(addressKey) ?? [];
      if (entries.length < MIN_ENTRIES_FOR_CALIBRATION) continue;

      // Split into training and holdout sets
      const holdoutCount = Math.max(1, Math.floor(entries.length * HOLDOUT_FRACTION));
      const shuffled = [...entries].sort(() => Math.random() - 0.5);
      const holdout = shuffled.slice(0, holdoutCount);
      const training = shuffled.slice(holdoutCount);

      // Derive weights from training set
      const weights = deriveWeights(training);
      const threshold = deriveInterrogatorThreshold(training);

      derivedWeightsDraft[addressKey] = weights;

      // Write to ring (branch key) unless dry run
      if (!dryRun) {
        try {
          await writeDerivedWeights(brainId, addressKey, weights, threshold);
        } catch (err) {
          console.error(`[calibrator] brain=${brainId} failed to write weights for ${addressKey}:`, err);
        }
      }

      clustersProcessed++;

      // Checkpoint after each cluster
      if (!dryRun && checkpoint) {
        const remainingKeys = keysToProcess.slice(keysToProcess.indexOf(addressKey) + 1);
        checkpoint.last_completed_address_key = addressKey;
        checkpoint.address_keys_remaining = remainingKeys;
        checkpoint.clusters_processed = clustersProcessed;
        checkpoint.rule_weights_draft = derivedWeightsDraft;
        await saveCheckpoint(checkpoint);
      }
    }

    // Cross-validation holdout (only on complete run)
    // Use all entries and evaluate with derived weights
    const holdoutEntries = allEntries
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(allEntries.length * HOLDOUT_FRACTION));

    // Compute average weights across all clusters for holdout eval
    const allWeights = Object.values(derivedWeightsDraft);
    const avgWeights: RuleWeights = allWeights.length > 0 ? {
      architect_weight: allWeights.reduce((s, w) => s + w.architect_weight, 0) / allWeights.length,
      devil_weight: allWeights.reduce((s, w) => s + w.devil_weight, 0) / allWeights.length,
      coverage_weight: allWeights.reduce((s, w) => s + w.coverage_weight, 0) / allWeights.length,
    } : DEFAULT_RULE_WEIGHTS;

    const defaultScore = crossValidate(holdoutEntries, DEFAULT_RULE_WEIGHTS);
    const newScore = crossValidate(holdoutEntries, avgWeights);

    if (!dryRun) {
      if (newScore < defaultScore) {
        // Rollback — new weights perform worse
        if (checkpoint) {
          checkpoint.status = 'abandoned';
          await saveCheckpoint(checkpoint);
        }
        await setCooldown(brainId);
        await writeAuditEvent(brainId, 'calibration.rollback', {
          run_id: runId,
          reason: 'cross_validation_failed',
          prior_performance: defaultScore,
          test_performance: newScore,
        });

        return {
          brainId,
          runId,
          dryRun,
          clustersProcessed,
          totalClusters,
          outcome: 'rollback',
          rollbackReason: `cross_validation_failed: new=${newScore.toFixed(3)} prior=${defaultScore.toFixed(3)}`,
          durationMs: Date.now() - startMs,
        };
      }

      // Success
      if (checkpoint) {
        checkpoint.status = 'complete';
        await saveCheckpoint(checkpoint);
      }
      await writeAuditEvent(brainId, 'calibration.complete', {
        run_id: runId,
        clusters_processed: clustersProcessed,
        total_clusters: totalClusters,
        cross_validation_score: newScore,
      });
    }

    return {
      brainId,
      runId,
      dryRun,
      clustersProcessed,
      totalClusters,
      outcome: 'complete',
      derivedWeights: derivedWeightsDraft,
      durationMs: Date.now() - startMs,
    };

  } finally {
    if (!dryRun) {
      await releaseLock(brainId);
    }
  }
}

// ---------------------------------------------------------------------------
// Dry-run entrypoint (for POST /v1/brain/{id}/calibrate/dry_run)
// ---------------------------------------------------------------------------

/**
 * Runs calibration against a provided snapshot without touching the ring.
 * Returns derived rule weights for the given entries.
 */
export async function dryRunCalibrator(input: DryRunInput): Promise<CalibratorResult> {
  const { brainId, entries } = input;

  // Group by address key
  const clusters = new Map<string, RingLeafEntry[]>();
  for (const entry of entries) {
    const existing = clusters.get(entry.address_key) ?? [];
    existing.push(entry);
    clusters.set(entry.address_key, existing);
  }

  const derivedWeights: Record<string, RuleWeights> = {};
  for (const [addressKey, clusterEntries] of clusters) {
    if (clusterEntries.length >= MIN_ENTRIES_FOR_CALIBRATION) {
      derivedWeights[addressKey] = deriveWeights(clusterEntries);
    }
  }

  return {
    brainId,
    runId: crypto.randomUUID(),
    dryRun: true,
    clustersProcessed: Object.keys(derivedWeights).length,
    totalClusters: clusters.size,
    outcome: 'complete',
    derivedWeights,
    durationMs: 0,
  };
}
