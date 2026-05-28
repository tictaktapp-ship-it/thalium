/**
 * src/jobs/consolidation-monitor.ts
 *
 * Consolidation Monitor -- watches buffer depth, invocation rate, and Calibrator
 * staleness. Autonomously triggers consolidation windows, runs the Calibrator,
 * and releases queued invocations at a metered rate on window close.
 *
 * Also includes the Interrogator pause watchdog: polls for anchors with
 * paused_at older than pause_timeout and emits chain.timeout on expiry.
 *
 * Runs as a background coroutine in App 2 (Instance Manager).
 *
 * SSE events emitted:
 * - instance.consolidating  -- window opened, new invocations queued
 * - instance.resumed        -- window closed, invocations releasing at metered rate
 *
 * Trigger conditions (any one):
 * 1. Buffer depth >= BUFFER_DEPTH_TRIGGER (100 jobs)
 * 2. Calibrator staleness >= STALENESS_TRIGGER_HOURS (24 hours since last run)
 * 3. Invocation rate spike (>= RATE_SPIKE_MULTIPLIER x rolling average)
 */

import { runCalibrator } from './calibrator.js';
import { getQueueDepth } from './buffer-drain.js';
import { shardA, shardB } from '../lib/redis.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const POLL_INTERVAL_MS = 30_000;
export const BUFFER_DEPTH_TRIGGER = 100;
export const STALENESS_TRIGGER_HOURS = 24;
export const RATE_SPIKE_MULTIPLIER = 3;
export const METERED_RELEASE_RATE = 20;
export const METERED_RELEASE_INTERVAL_MS = Math.floor(1000 / METERED_RELEASE_RATE);
export const INTERROGATOR_POLL_INTERVAL_MS = 60_000;
export const DEFAULT_PAUSE_TIMEOUT_MINUTES = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonitorResult {
  brainId: string;
  triggered: boolean;
  triggerReason?: string;
  calibrationOutcome?: string;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// State management (Shard A)
// ---------------------------------------------------------------------------

export async function getConsolidationFlag(brainId: string): Promise<boolean> {
  try {
    const value = await shardA.get<string>(`consolidating:${brainId}`);
    return value !== null;
  } catch {
    return false;
  }
}

export async function setConsolidationFlag(brainId: string): Promise<void> {
  try {
    await shardA.set(`consolidating:${brainId}`, new Date().toISOString());
  } catch {}
}

export async function clearConsolidationFlag(brainId: string): Promise<void> {
  try {
    await shardA.del(`consolidating:${brainId}`);
  } catch {}
}

export async function getLastCalibrationTime(brainId: string): Promise<Date | null> {
  try {
    const value = await shardA.get<string>(`last_calibration:${brainId}`);
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
}

export async function setLastCalibrationTime(brainId: string): Promise<void> {
  try {
    await shardA.set(`last_calibration:${brainId}`, new Date().toISOString());
  } catch {}
}

// ---------------------------------------------------------------------------
// SSE event emission -- writes to Shard B for Chain Executor to stream
// ---------------------------------------------------------------------------

async function emitSSEEvent(
  brainId: string,
  eventType: 'instance.consolidating' | 'instance.resumed',
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const eventKey = `sse_events:${brainId}`;
    const event = JSON.stringify({
      type: eventType,
      brain_id: brainId,
      timestamp: new Date().toISOString(),
      ...payload,
    });
    await shardB.rpush(eventKey, event);
    await shardB.expire(eventKey, 300);
  } catch {}
}

// ---------------------------------------------------------------------------
// Trigger condition checks
// ---------------------------------------------------------------------------

export async function checkBufferDepthTrigger(brainId: string): Promise<boolean> {
  const depth = await getQueueDepth(brainId);
  return depth >= BUFFER_DEPTH_TRIGGER;
}

export async function checkStalenessTrigger(brainId: string): Promise<boolean> {
  const lastCalibration = await getLastCalibrationTime(brainId);
  if (!lastCalibration) return true;
  const hoursSinceLastRun = (Date.now() - lastCalibration.getTime()) / (1000 * 3600);
  return hoursSinceLastRun >= STALENESS_TRIGGER_HOURS;
}

export function checkRateSpikeTrigger(currentRate: number, rateHistory: number[]): boolean {
  if (rateHistory.length < 3) return false;
  const rollingAvg = rateHistory.reduce((a, b) => a + b, 0) / rateHistory.length;
  if (rollingAvg === 0) return false;
  return currentRate >= rollingAvg * RATE_SPIKE_MULTIPLIER;
}

// ---------------------------------------------------------------------------
// Interrogator pause watchdog
// ---------------------------------------------------------------------------

export async function runInterrogatorWatchdog(brainId: string): Promise<number> {
  let timedOutCount = 0;
  try {
    const keys = await shardA.keys('anc_*');
    for (const key of keys) {
      try {
        const rawAnchor = await shardA.get<unknown>(key);
        if (!rawAnchor) continue;
        const anchor = typeof rawAnchor === 'string' ? JSON.parse(rawAnchor) : rawAnchor;
        if (anchor?.brain_id !== brainId) continue;
        const pausedAt = anchor?.paused_at;
        if (!pausedAt) continue;
        const pauseTimeoutMinutes = anchor?.pause_timeout_minutes ?? DEFAULT_PAUSE_TIMEOUT_MINUTES;
        const pausedMs = Date.now() - new Date(pausedAt).getTime();
        const timeoutMs = pauseTimeoutMinutes * 60 * 1000;
        if (pausedMs > timeoutMs) {
          await emitSSEEvent(brainId, 'instance.consolidating', {
            event_subtype: 'chain.timeout',
            session_id: anchor.session_id,
            reason: 'interrogator_pause_timeout',
            paused_for_minutes: Math.floor(pausedMs / 60000),
          });
          await shardA.del(key);
          timedOutCount++;
          console.log(`[consolidation-monitor] chain.timeout brain=${brainId} session=${anchor.session_id}`);
        }
      } catch {}
    }
  } catch {}
  return timedOutCount;
}

// ---------------------------------------------------------------------------
// Consolidation window lifecycle
// ---------------------------------------------------------------------------

export async function openConsolidationWindow(brainId: string, triggerReason: string): Promise<MonitorResult> {
  const startMs = Date.now();
  console.log(`[consolidation-monitor] Opening window for brain=${brainId} reason=${triggerReason}`);

  await setConsolidationFlag(brainId);
  await emitSSEEvent(brainId, 'instance.consolidating', { reason: triggerReason });

  let calibrationOutcome = 'unknown';
  try {
    const result = await runCalibrator(brainId);
    calibrationOutcome = result.outcome;
    if (result.outcome === 'complete' || result.outcome === 'checkpoint') {
      await setLastCalibrationTime(brainId);
    }
  } catch (err) {
    calibrationOutcome = 'error';
    console.error(`[consolidation-monitor] Calibrator failed for brain=${brainId}:`, err);
  }

  await clearConsolidationFlag(brainId);
  await emitSSEEvent(brainId, 'instance.resumed', {
    calibration_outcome: calibrationOutcome,
    release_rate: METERED_RELEASE_RATE,
  });

  console.log(`[consolidation-monitor] Window closed brain=${brainId} calibration=${calibrationOutcome} duration=${Date.now() - startMs}ms`);

  return {
    brainId,
    triggered: true,
    triggerReason,
    calibrationOutcome,
    durationMs: Date.now() - startMs,
  };
}

// ---------------------------------------------------------------------------
// Main monitor loop
// ---------------------------------------------------------------------------

let monitorRunning = false;

export async function startConsolidationMonitor(brainId: string): Promise<void> {
  monitorRunning = true;
  const rateHistory: number[] = [];
  let lastInvocationCount = 0;
  let watchdogTick = 0;

  console.log(`[consolidation-monitor] Starting monitor for brain=${brainId}`);

  while (monitorRunning) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    try {
      watchdogTick++;
      if (watchdogTick % 2 === 0) {
        await runInterrogatorWatchdog(brainId);
      }
      const isConsolidating = await getConsolidationFlag(brainId);
      if (isConsolidating) continue;

      const currentDepth = await getQueueDepth(brainId);
      const invocationDelta = Math.max(0, currentDepth - lastInvocationCount);
      lastInvocationCount = currentDepth;
      rateHistory.push(invocationDelta);
      if (rateHistory.length > 10) rateHistory.shift();

      const bufferTrigger = await checkBufferDepthTrigger(brainId);
      const stalenessTrigger = await checkStalenessTrigger(brainId);
      const rateTrigger = checkRateSpikeTrigger(invocationDelta, rateHistory);

      let triggerReason: string | null = null;
      if (bufferTrigger) triggerReason = 'buffer_depth';
      else if (stalenessTrigger) triggerReason = 'calibrator_staleness';
      else if (rateTrigger) triggerReason = 'rate_spike';

      if (triggerReason) {
        await openConsolidationWindow(brainId, triggerReason);
      }
    } catch (err) {
      console.error(`[consolidation-monitor] brain=${brainId} poll error:`, err);
    }
  }

  console.log(`[consolidation-monitor] Monitor stopped for brain=${brainId}`);
}

export function stopConsolidationMonitor(): void {
  monitorRunning = false;
}
