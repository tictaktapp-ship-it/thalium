/**
 * src/tests/unit/calibrator.test.ts
 *
 * Unit tests for the Calibrator job (src/jobs/calibrator.ts).
 * All external dependencies mocked — no live Redis or Supabase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockShardAGet = vi.fn();
const mockShardASet = vi.fn();
const mockShardADel = vi.fn();
const mockShardCSet = vi.fn();
const mockLibrarianWrite = vi.fn();
const mockFetch = vi.fn();

vi.mock('../../lib/redis.js', () => ({
  shardA: { get: mockShardAGet, set: mockShardASet, del: mockShardADel },
  shardC: { set: mockShardCSet },
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

// Mock global fetch
vi.stubGlobal('fetch', mockFetch);

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' });

const {
  acquireLock,
  releaseLock,
  isOnCooldown,
  setCooldown,
  deriveWeights,
  deriveInterrogatorThreshold,
  crossValidate,
  dryRunCalibrator,
  runCalibrator,
  DEFAULT_RULE_WEIGHTS,
  DEFAULT_INTERROGATOR_THRESHOLD,
  MIN_ENTRIES_FOR_CALIBRATION,
  HOLDOUT_FRACTION,
  LOCK_TTL_SECONDS,
} = await import('../../jobs/calibrator.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_BRAIN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeEntry(overrides?: Partial<{
  id: string;
  address_key: string;
  confidence: number;
  content: Record<string, unknown>;
  created_at: string;
}>) {
  return {
    id: crypto.randomUUID(),
    address_key: 'specification.project.software.general',
    confidence: 80,
    content: { summary: 'test entry' },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeEntries(count: number, addressKey = 'specification.project.software.general', confidence = 80) {
  return Array.from({ length: count }, (_, i) =>
    makeEntry({ id: `entry-${i}`, address_key: addressKey, confidence }),
  );
}

function mockSupabaseEmpty() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [],
  });
}

function mockSupabaseEntries(entries: ReturnType<typeof makeEntry>[]) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => entries,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calibrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShardAGet.mockResolvedValue(null);
    mockShardASet.mockResolvedValue('OK');
    mockShardADel.mockResolvedValue(1);
    mockShardCSet.mockResolvedValue('OK');
    mockLibrarianWrite.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  // -------------------------------------------------------------------------
  // Constants
  // -------------------------------------------------------------------------

  it('lock TTL is 90 seconds', () => {
    expect(LOCK_TTL_SECONDS).toBe(90);
  });

  it('holdout fraction is 10%', () => {
    expect(HOLDOUT_FRACTION).toBe(0.1);
  });

  it('minimum entries for calibration is 5', () => {
    expect(MIN_ENTRIES_FOR_CALIBRATION).toBe(5);
  });

  it('default rule weights sum to 1.0', () => {
    const { architect_weight, devil_weight, coverage_weight } = DEFAULT_RULE_WEIGHTS;
    expect(architect_weight + devil_weight + coverage_weight).toBeCloseTo(1.0);
  });

  it('default interrogator threshold is 0.7', () => {
    expect(DEFAULT_INTERROGATOR_THRESHOLD).toBe(0.7);
  });

  // -------------------------------------------------------------------------
  // Advisory lock
  // -------------------------------------------------------------------------

  it('acquireLock returns true when lock is set successfully', async () => {
    mockShardASet.mockResolvedValue('OK');
    const result = await acquireLock(TEST_BRAIN_ID);
    expect(result).toBe(true);
    expect(mockShardASet).toHaveBeenCalledWith(
      `calibrator_lock:${TEST_BRAIN_ID}`,
      'locked',
      { ex: LOCK_TTL_SECONDS, nx: true },
    );
  });

  it('acquireLock returns false when lock already held (NX fails)', async () => {
    mockShardASet.mockResolvedValue(null);
    const result = await acquireLock(TEST_BRAIN_ID);
    expect(result).toBe(false);
  });

  it('acquireLock returns false on Redis error', async () => {
    mockShardASet.mockRejectedValue(new Error('Redis error'));
    const result = await acquireLock(TEST_BRAIN_ID);
    expect(result).toBe(false);
  });

  it('releaseLock deletes the lock key from Shard A', async () => {
    await releaseLock(TEST_BRAIN_ID);
    expect(mockShardADel).toHaveBeenCalledWith(`calibrator_lock:${TEST_BRAIN_ID}`);
  });

  // -------------------------------------------------------------------------
  // Cooldown
  // -------------------------------------------------------------------------

  it('isOnCooldown returns false when no cooldown key in Shard A', async () => {
    mockShardAGet.mockResolvedValue(null);
    const result = await isOnCooldown(TEST_BRAIN_ID);
    expect(result).toBe(false);
  });

  it('isOnCooldown returns true when cooldown key present', async () => {
    mockShardAGet.mockResolvedValue('1');
    const result = await isOnCooldown(TEST_BRAIN_ID);
    expect(result).toBe(true);
  });

  it('setCooldown sets 24-hour TTL in Shard A', async () => {
    await setCooldown(TEST_BRAIN_ID);
    expect(mockShardASet).toHaveBeenCalledWith(
      `calibrator_cooldown:${TEST_BRAIN_ID}`,
      '1',
      { ex: 24 * 3600 },
    );
  });

  // -------------------------------------------------------------------------
  // Weight derivation
  // -------------------------------------------------------------------------

  it('deriveWeights returns weights that sum to ~1.0', () => {
    const entries = makeEntries(10);
    const weights = deriveWeights(entries);
    const sum = weights.architect_weight + weights.devil_weight + weights.coverage_weight;
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it('deriveWeights returns default weights for empty entries', () => {
    const weights = deriveWeights([]);
    expect(weights).toEqual(DEFAULT_RULE_WEIGHTS);
  });

  it('deriveWeights produces higher architect_weight for high-confidence entries', () => {
    const highConf = makeEntries(20, 'specification.project.software.general', 95);
    const lowConf = makeEntries(20, 'specification.project.software.general', 30);
    const highWeights = deriveWeights(highConf);
    const lowWeights = deriveWeights(lowConf);
    expect(highWeights.architect_weight).toBeGreaterThan(lowWeights.architect_weight);
  });

  it('deriveWeights all weights are between 0 and 1', () => {
    const entries = makeEntries(15, 'specification.project.software.general', 70);
    const weights = deriveWeights(entries);
    expect(weights.architect_weight).toBeGreaterThan(0);
    expect(weights.architect_weight).toBeLessThan(1);
    expect(weights.devil_weight).toBeGreaterThan(0);
    expect(weights.devil_weight).toBeLessThan(1);
    expect(weights.coverage_weight).toBeGreaterThan(0);
    expect(weights.coverage_weight).toBeLessThan(1);
  });

  // -------------------------------------------------------------------------
  // Interrogator threshold derivation
  // -------------------------------------------------------------------------

  it('deriveInterrogatorThreshold returns default for empty entries', () => {
    expect(deriveInterrogatorThreshold([])).toBe(DEFAULT_INTERROGATOR_THRESHOLD);
  });

  it('deriveInterrogatorThreshold is higher for high-confidence entries', () => {
    const highConf = makeEntries(10, 'specification.project.software.general', 95);
    const lowConf = makeEntries(10, 'specification.project.software.general', 20);
    expect(deriveInterrogatorThreshold(highConf)).toBeGreaterThan(
      deriveInterrogatorThreshold(lowConf),
    );
  });

  it('deriveInterrogatorThreshold is between 0.5 and 0.9', () => {
    const entries = makeEntries(10);
    const threshold = deriveInterrogatorThreshold(entries);
    expect(threshold).toBeGreaterThanOrEqual(0.5);
    expect(threshold).toBeLessThanOrEqual(0.9);
  });

  // -------------------------------------------------------------------------
  // Cross-validation
  // -------------------------------------------------------------------------

  it('crossValidate returns 1.0 for empty holdout', () => {
    expect(crossValidate([], DEFAULT_RULE_WEIGHTS)).toBe(1.0);
  });

  it('crossValidate returns a score between 0 and 1', () => {
    const holdout = makeEntries(5);
    const score = crossValidate(holdout, DEFAULT_RULE_WEIGHTS);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // Dry-run calibrator
  // -------------------------------------------------------------------------

  it('dryRunCalibrator returns complete outcome with derived weights', async () => {
    const entries = makeEntries(10);
    const result = await dryRunCalibrator({ brainId: TEST_BRAIN_ID, entries });

    expect(result.dryRun).toBe(true);
    expect(result.outcome).toBe('complete');
    expect(result.clustersProcessed).toBe(1);
    expect(result.derivedWeights).toBeDefined();
    expect(result.derivedWeights!['specification.project.software.general']).toBeDefined();
  });

  it('dryRunCalibrator does not call librarianWrite', async () => {
    const entries = makeEntries(10);
    await dryRunCalibrator({ brainId: TEST_BRAIN_ID, entries });
    expect(mockLibrarianWrite).not.toHaveBeenCalled();
  });

  it('dryRunCalibrator skips clusters with fewer than MIN_ENTRIES entries', async () => {
    const entries = makeEntries(3); // below minimum
    const result = await dryRunCalibrator({ brainId: TEST_BRAIN_ID, entries });
    expect(result.clustersProcessed).toBe(0);
  });

  it('dryRunCalibrator handles multiple address key clusters', async () => {
    const entries = [
      ...makeEntries(8, 'specification.project.software.general'),
      ...makeEntries(6, 'diagnosis.entity.software.general'),
    ];
    const result = await dryRunCalibrator({ brainId: TEST_BRAIN_ID, entries });
    expect(result.clustersProcessed).toBe(2);
    expect(Object.keys(result.derivedWeights!)).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // runCalibrator — lock and cooldown behaviour
  // -------------------------------------------------------------------------

  it('runCalibrator skips when on cooldown', async () => {
    mockShardAGet.mockResolvedValue('1'); // cooldown active
    const result = await runCalibrator(TEST_BRAIN_ID);
    expect(result.outcome).toBe('skipped');
    expect(mockShardASet).not.toHaveBeenCalled();
  });

  it('runCalibrator skips when cannot acquire lock', async () => {
    mockShardAGet.mockResolvedValue(null); // no cooldown
    mockShardASet.mockResolvedValue(null); // lock acquisition fails
    const result = await runCalibrator(TEST_BRAIN_ID);
    expect(result.outcome).toBe('skipped');
  });

  it('runCalibrator returns insufficient_data when ring has too few entries', async () => {
    mockShardASet.mockResolvedValue('OK'); // lock acquired
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeEntries(2), // below minimum
    });

    const result = await runCalibrator(TEST_BRAIN_ID);
    expect(result.outcome).toBe('insufficient_data');
    expect(mockShardADel).toHaveBeenCalled(); // lock released
  });

  it('runCalibrator releases lock even on error', async () => {
    mockShardASet.mockResolvedValue('OK');
    mockFetch.mockRejectedValue(new Error('Fetch failed'));

    try {
      await runCalibrator(TEST_BRAIN_ID);
    } catch {
      // Expected
    }

    expect(mockShardADel).toHaveBeenCalledWith(`calibrator_lock:${TEST_BRAIN_ID}`);
  });
});
