content = open("E:/thalium/src/tests/unit/consolidation-monitor.test.ts", "w", encoding="utf-8")
content.write("""/**
 * src/tests/unit/consolidation-monitor.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockShardAGet = vi.fn();
const mockShardASet = vi.fn();
const mockShardADel = vi.fn();
const mockShardAKeys = vi.fn();
const mockShardBRpush = vi.fn();
const mockShardBExpire = vi.fn();
const mockGetQueueDepth = vi.fn();
const mockRunCalibrator = vi.fn();

vi.mock('../../lib/redis.js', () => ({
  shardA: { get: mockShardAGet, set: mockShardASet, del: mockShardADel, keys: mockShardAKeys },
  shardB: { rpush: mockShardBRpush, expire: mockShardBExpire },
}));

vi.mock('../../jobs/calibrator.js', () => ({ runCalibrator: mockRunCalibrator }));
vi.mock('../../jobs/buffer-drain.js', () => ({ getQueueDepth: mockGetQueueDepth }));

const {
  getConsolidationFlag, setConsolidationFlag, clearConsolidationFlag,
  checkBufferDepthTrigger, checkStalenessTrigger, checkRateSpikeTrigger,
  openConsolidationWindow,
  BUFFER_DEPTH_TRIGGER, STALENESS_TRIGGER_HOURS, RATE_SPIKE_MULTIPLIER, METERED_RELEASE_RATE,
} = await import('../../jobs/consolidation-monitor.js');

const BRAIN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('consolidation-monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShardAGet.mockResolvedValue(null);
    mockShardASet.mockResolvedValue('OK');
    mockShardADel.mockResolvedValue(1);
    mockShardAKeys.mockResolvedValue([]);
    mockShardBRpush.mockResolvedValue(1);
    mockShardBExpire.mockResolvedValue(1);
    mockGetQueueDepth.mockResolvedValue(0);
    mockRunCalibrator.mockResolvedValue({ outcome: 'complete' });
  });

  it('buffer depth trigger is 100', () => { expect(BUFFER_DEPTH_TRIGGER).toBe(100); });
  it('staleness trigger is 24 hours', () => { expect(STALENESS_TRIGGER_HOURS).toBe(24); });
  it('rate spike multiplier is 3', () => { expect(RATE_SPIKE_MULTIPLIER).toBe(3); });
  it('metered release rate is 20/sec', () => { expect(METERED_RELEASE_RATE).toBe(20); });

  it('getConsolidationFlag returns false when key absent', async () => {
    mockShardAGet.mockResolvedValue(null);
    expect(await getConsolidationFlag(BRAIN_ID)).toBe(false);
  });

  it('getConsolidationFlag returns true when key present', async () => {
    mockShardAGet.mockResolvedValue('2026-05-20T00:00:00Z');
    expect(await getConsolidationFlag(BRAIN_ID)).toBe(true);
  });

  it('setConsolidationFlag writes to Shard A', async () => {
    await setConsolidationFlag(BRAIN_ID);
    expect(mockShardASet).toHaveBeenCalledWith(`consolidating:${BRAIN_ID}`, expect.any(String));
  });

  it('clearConsolidationFlag deletes key from Shard A', async () => {
    await clearConsolidationFlag(BRAIN_ID);
    expect(mockShardADel).toHaveBeenCalledWith(`consolidating:${BRAIN_ID}`);
  });

  it('checkBufferDepthTrigger returns true when depth >= trigger', async () => {
    mockGetQueueDepth.mockResolvedValue(100);
    expect(await checkBufferDepthTrigger(BRAIN_ID)).toBe(true);
  });

  it('checkBufferDepthTrigger returns false when depth below trigger', async () => {
    mockGetQueueDepth.mockResolvedValue(50);
    expect(await checkBufferDepthTrigger(BRAIN_ID)).toBe(false);
  });

  it('checkStalenessTrigger returns true when never calibrated', async () => {
    mockShardAGet.mockResolvedValue(null);
    expect(await checkStalenessTrigger(BRAIN_ID)).toBe(true);
  });

  it('checkStalenessTrigger returns true when last calibration was > 24h ago', async () => {
    const oldDate = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    mockShardAGet.mockResolvedValue(oldDate);
    expect(await checkStalenessTrigger(BRAIN_ID)).toBe(true);
  });

  it('checkStalenessTrigger returns false when last calibration was recent', async () => {
    const recentDate = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
    mockShardAGet.mockResolvedValue(recentDate);
    expect(await checkStalenessTrigger(BRAIN_ID)).toBe(false);
  });

  it('checkRateSpikeTrigger returns false with insufficient history', () => {
    expect(checkRateSpikeTrigger(100, [10, 12])).toBe(false);
  });

  it('checkRateSpikeTrigger returns true when current rate >= 3x rolling avg', () => {
    expect(checkRateSpikeTrigger(90, [10, 10, 10, 10, 10])).toBe(true);
  });

  it('checkRateSpikeTrigger returns false when rate is normal', () => {
    expect(checkRateSpikeTrigger(12, [10, 10, 10, 10, 10])).toBe(false);
  });

  it('checkRateSpikeTrigger returns false when rolling avg is zero', () => {
    expect(checkRateSpikeTrigger(100, [0, 0, 0, 0, 0])).toBe(false);
  });

  it('openConsolidationWindow sets flag, runs calibrator, clears flag', async () => {
    const result = await openConsolidationWindow(BRAIN_ID, 'buffer_depth');
    expect(result.triggered).toBe(true);
    expect(result.triggerReason).toBe('buffer_depth');
    expect(result.calibrationOutcome).toBe('complete');
    expect(mockRunCalibrator).toHaveBeenCalledWith(BRAIN_ID);
    expect(mockShardASet).toHaveBeenCalledWith(`consolidating:${BRAIN_ID}`, expect.any(String));
    expect(mockShardADel).toHaveBeenCalledWith(`consolidating:${BRAIN_ID}`);
  });

  it('openConsolidationWindow emits instance.consolidating and instance.resumed SSE events', async () => {
    await openConsolidationWindow(BRAIN_ID, 'calibrator_staleness');
    const pushCalls = mockShardBRpush.mock.calls;
    const eventTypes = pushCalls.map(([, payload]: [string, string]) => JSON.parse(payload).type);
    expect(eventTypes).toContain('instance.consolidating');
    expect(eventTypes).toContain('instance.resumed');
  });

  it('openConsolidationWindow clears flag even when calibrator fails', async () => {
    mockRunCalibrator.mockRejectedValue(new Error('Calibrator error'));
    const result = await openConsolidationWindow(BRAIN_ID, 'buffer_depth');
    expect(result.calibrationOutcome).toBe('error');
    expect(mockShardADel).toHaveBeenCalledWith(`consolidating:${BRAIN_ID}`);
  });
});
""")
content.close()
print("WRITTEN OK")
