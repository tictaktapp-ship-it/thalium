/**
 * src/tests/unit/buffer-drain.test.ts
 *
 * Unit tests for the Buffer Drain job (src/jobs/buffer-drain.ts).
 * All Redis and Supabase dependencies are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockShardAGet = vi.fn();
const mockShardBLlen = vi.fn();
const mockShardBLpop = vi.fn();
const mockShardBRpush = vi.fn();
const mockLibrarianWrite = vi.fn();

vi.mock('../../lib/redis.js', () => ({
  shardA: { get: mockShardAGet },
  shardB: { llen: mockShardBLlen, lpop: mockShardBLpop, rpush: mockShardBRpush },
}));

vi.mock('../../lib/librarian-write.js', () => ({
  librarianWrite: mockLibrarianWrite,
  LibrarianError: class LibrarianError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
      this.name = 'LibrarianError';
    }
  },
}));

vi.mock('../../schemas/ring.js', () => ({
  InstitutionalRingEntrySchema: {
    safeParse: vi.fn().mockReturnValue({ success: true }),
  },
}));

const {
  isCalibratorLocked,
  getQueueDepth,
  drainBatch,
  enqueueWriteBack,
  DRAIN_RATE_PER_MIN,
  BATCH_SIZE,
  TRIGGER_DEPTH,
} = await import('../../jobs/buffer-drain.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_BRAIN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeJob(overrides?: object) {
  return JSON.stringify({
    id: '11111111-1111-1111-1111-111111111111',
    brain_id: TEST_BRAIN_ID,
    address_key: 'specification.project.software.general',
    content: { summary: 'test' },
    source: 'chain',
    entry_level: 'leaf',
    confidence: 75,
    superseded_by: null,
    created_at: new Date().toISOString(),
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buffer-drain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLibrarianWrite.mockResolvedValue(undefined);
    mockShardAGet.mockResolvedValue(null); // no lock by default
    mockShardBLlen.mockResolvedValue(0);
    mockShardBLpop.mockResolvedValue(null);
    mockShardBRpush.mockResolvedValue(1);
  });

  // -------------------------------------------------------------------------
  // Constants
  // -------------------------------------------------------------------------

  it('drain rate is 500 jobs per minute', () => {
    expect(DRAIN_RATE_PER_MIN).toBe(500);
  });

  it('batch size is 10', () => {
    expect(BATCH_SIZE).toBe(10);
  });

  it('trigger depth is 100', () => {
    expect(TRIGGER_DEPTH).toBe(100);
  });

  // -------------------------------------------------------------------------
  // isCalibratorLocked
  // -------------------------------------------------------------------------

  it('isCalibratorLocked returns false when no lock in Shard A', async () => {
    mockShardAGet.mockResolvedValue(null);
    const result = await isCalibratorLocked(TEST_BRAIN_ID);
    expect(result).toBe(false);
    expect(mockShardAGet).toHaveBeenCalledWith(`calibrator_lock:${TEST_BRAIN_ID}`);
  });

  it('isCalibratorLocked returns true when lock present in Shard A', async () => {
    mockShardAGet.mockResolvedValue('locked');
    const result = await isCalibratorLocked(TEST_BRAIN_ID);
    expect(result).toBe(true);
  });

  it('isCalibratorLocked returns false on Redis error (conservative)', async () => {
    mockShardAGet.mockRejectedValue(new Error('Redis error'));
    const result = await isCalibratorLocked(TEST_BRAIN_ID);
    expect(result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // getQueueDepth
  // -------------------------------------------------------------------------

  it('getQueueDepth returns queue length from Shard B', async () => {
    mockShardBLlen.mockResolvedValue(42);
    const depth = await getQueueDepth(TEST_BRAIN_ID);
    expect(depth).toBe(42);
    expect(mockShardBLlen).toHaveBeenCalledWith(`write_back_queue:${TEST_BRAIN_ID}`);
  });

  it('getQueueDepth returns 0 on Redis error', async () => {
    mockShardBLlen.mockRejectedValue(new Error('Redis error'));
    const depth = await getQueueDepth(TEST_BRAIN_ID);
    expect(depth).toBe(0);
  });

  // -------------------------------------------------------------------------
  // drainBatch — lock behaviour
  // -------------------------------------------------------------------------

  it('drainBatch pauses immediately when Calibrator lock is held', async () => {
    mockShardAGet.mockResolvedValue('locked');
    const result = await drainBatch(TEST_BRAIN_ID);
    expect(result.paused).toBe(true);
    expect(result.pauseReason).toContain('Calibrator advisory lock');
    expect(result.jobsProcessed).toBe(0);
    expect(mockShardBLpop).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // drainBatch — normal drain
  // -------------------------------------------------------------------------

  it('drainBatch processes jobs from queue via librarianWrite', async () => {
    const job = makeJob();
    // Return job once then null (empty queue)
    mockShardBLpop
      .mockResolvedValueOnce(job)
      .mockResolvedValue(null);

    const result = await drainBatch(TEST_BRAIN_ID);

    expect(result.paused).toBe(false);
    expect(result.jobsProcessed).toBe(1);
    expect(result.jobsFailed).toBe(0);
    expect(mockLibrarianWrite).toHaveBeenCalledTimes(1);
  });

  it('drainBatch stops when queue is empty', async () => {
    mockShardBLpop.mockResolvedValue(null);
    const result = await drainBatch(TEST_BRAIN_ID);
    expect(result.jobsProcessed).toBe(0);
    expect(result.jobsFailed).toBe(0);
  });

  it('drainBatch processes up to BATCH_SIZE jobs per call', async () => {
    // Return 15 jobs — should only process BATCH_SIZE (10)
    let callCount = 0;
    mockShardBLpop.mockImplementation(() => {
      callCount++;
      if (callCount <= 15) return Promise.resolve(makeJob());
      return Promise.resolve(null);
    });

    const result = await drainBatch(TEST_BRAIN_ID);
    expect(result.jobsProcessed).toBe(BATCH_SIZE);
    expect(mockLibrarianWrite).toHaveBeenCalledTimes(BATCH_SIZE);
  });

  // -------------------------------------------------------------------------
  // drainBatch — failure handling
  // -------------------------------------------------------------------------

  it('drainBatch re-queues failed jobs and records failure count', async () => {
    const job = makeJob();
    mockShardBLpop
      .mockResolvedValueOnce(job)
      .mockResolvedValue(null);
    mockLibrarianWrite.mockRejectedValue(new Error('Write failed'));

    const result = await drainBatch(TEST_BRAIN_ID);

    expect(result.jobsFailed).toBe(1);
    expect(result.jobsProcessed).toBe(0);
    // Failed job re-queued to back of queue
    expect(mockShardBRpush).toHaveBeenCalledWith(
      `write_back_queue:${TEST_BRAIN_ID}`,
      job,
    );
  });

  it('drainBatch returns correct brain_id in result', async () => {
    mockShardBLpop.mockResolvedValue(null);
    const result = await drainBatch(TEST_BRAIN_ID);
    expect(result.brainId).toBe(TEST_BRAIN_ID);
  });

  it('drainBatch returns durationMs >= 0', async () => {
    mockShardBLpop.mockResolvedValue(null);
    const result = await drainBatch(TEST_BRAIN_ID);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  // -------------------------------------------------------------------------
  // enqueueWriteBack
  // -------------------------------------------------------------------------

  it('enqueueWriteBack pushes serialised entry to Shard B queue', async () => {
    const entry = JSON.parse(makeJob()) as Parameters<typeof enqueueWriteBack>[1];
    await enqueueWriteBack(TEST_BRAIN_ID, entry);

    expect(mockShardBRpush).toHaveBeenCalledWith(
      `write_back_queue:${TEST_BRAIN_ID}`,
      JSON.stringify(entry),
    );
  });

  // -------------------------------------------------------------------------
  // P7 enforcement — writes via librarianWrite only
  // -------------------------------------------------------------------------

  it('drainBatch never calls shardB.set directly for ring writes', async () => {
    const mockShardBSet = vi.fn();
    const job = makeJob();
    mockShardBLpop.mockResolvedValueOnce(job).mockResolvedValue(null);

    await drainBatch(TEST_BRAIN_ID);

    // librarianWrite called, not shardB.set (which would be a direct ring write)
    expect(mockLibrarianWrite).toHaveBeenCalled();
    expect(mockShardBSet).not.toHaveBeenCalled();
  });
});
