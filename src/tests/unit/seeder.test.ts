/**
 * src/tests/unit/seeder.test.ts
 *
 * Unit tests for the cold-start seeding pipeline (src/jobs/seeder.ts).
 *
 * All external dependencies (librarianWrite, shardC) are mocked so tests
 * run without live Supabase or Redis connections.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SeederOptions, SeederResult } from '../../jobs/seeder.js';

// ---------------------------------------------------------------------------
// Mocks — must be defined before importing the module under test
// ---------------------------------------------------------------------------

const mockLibrarianWrite = vi.fn().mockResolvedValue(undefined);
const mockShardCGet = vi.fn().mockRejectedValue(new Error('cache miss'));
const mockShardCSet = vi.fn().mockResolvedValue('OK');

vi.mock('../../lib/librarian-write.js', () => ({
  librarianWrite: mockLibrarianWrite,
}));

vi.mock('../../lib/redis.js', () => ({
  shardC: {
    get: mockShardCGet,
    set: mockShardCSet,
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

// Import after mocks are registered
const { seedBrainInstance } = await import('../../jobs/seeder.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_BRAIN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const TEST_DOMAIN = 'software';

function makeOptions(overrides?: Partial<SeederOptions>): SeederOptions {
  return {
    brainId: TEST_BRAIN_ID,
    domain: TEST_DOMAIN,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('seedBrainInstance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLibrarianWrite.mockResolvedValue(undefined);
    mockShardCGet.mockRejectedValue(new Error('cache miss'));
    mockShardCSet.mockResolvedValue('OK');
  });

  // -------------------------------------------------------------------------
  // 1. Writes the correct number of entries
  // -------------------------------------------------------------------------

  it('writes 30 entries (3 per region × 10 regions) on a fresh Brain Instance', async () => {
    const result: SeederResult = await seedBrainInstance(makeOptions());

    expect(result.entriesWritten).toBe(30);
    expect(mockLibrarianWrite).toHaveBeenCalledTimes(30);
  });

  // -------------------------------------------------------------------------
  // 2. All writes use source: 'seeding'
  // -------------------------------------------------------------------------

  it('every librarianWrite call sets source to "seeding"', async () => {
    await seedBrainInstance(makeOptions());

    const calls = mockLibrarianWrite.mock.calls;
    for (const [entry] of calls) {
      expect(entry.source).toBe('seeding');
    }
  });

  // -------------------------------------------------------------------------
  // 3. All writes use entry_level: 'leaf'
  // -------------------------------------------------------------------------

  it('every librarianWrite call sets entry_level to "leaf"', async () => {
    await seedBrainInstance(makeOptions());

    const calls = mockLibrarianWrite.mock.calls;
    for (const [entry] of calls) {
      expect(entry.entry_level).toBe('leaf');
    }
  });

  // -------------------------------------------------------------------------
  // 4. Address keys are 4-level ltree strings with correct structure
  // -------------------------------------------------------------------------

  it('all address keys have exactly 4 ltree levels', async () => {
    await seedBrainInstance(makeOptions());

    const addressKeys = mockLibrarianWrite.mock.calls.map(([entry]) => entry.address_key as string);
    for (const key of addressKeys) {
      const levels = key.split('.');
      expect(levels).toHaveLength(4);
    }
  });

  it('address key level 1 is always a valid intent type', async () => {
    const validIntentTypes = [
      'specification', 'change_request', 'diagnosis', 'verification',
      'risk_assessment', 'retrospective', 'planning', 'knowledge_retrieval',
      'compliance_check', 'knowledge_ingestion',
    ];

    await seedBrainInstance(makeOptions());

    const addressKeys = mockLibrarianWrite.mock.calls.map(([entry]) => entry.address_key as string);
    for (const key of addressKeys) {
      const intentType = key.split('.')[0];
      expect(validIntentTypes).toContain(intentType);
    }
  });

  it('address key level 3 matches the provided domain', async () => {
    await seedBrainInstance(makeOptions({ domain: 'legal' }));

    const addressKeys = mockLibrarianWrite.mock.calls.map(([entry]) => entry.address_key as string);
    for (const key of addressKeys) {
      const domain = key.split('.')[2];
      expect(domain).toBe('legal');
    }
  });

  it('address key level 4 is "general" for all seeded entries', async () => {
    await seedBrainInstance(makeOptions());

    const addressKeys = mockLibrarianWrite.mock.calls.map(([entry]) => entry.address_key as string);
    for (const key of addressKeys) {
      const specificity = key.split('.')[3];
      expect(specificity).toBe('general');
    }
  });

  // -------------------------------------------------------------------------
  // 5. Populates all 10 address key regions
  // -------------------------------------------------------------------------

  it('populates all 10 standard address key regions', async () => {
    const result: SeederResult = await seedBrainInstance(makeOptions());

    expect(result.addressKeysPopulated).toHaveLength(10);

    const expectedRegionPrefixes = [
      'specification.project',
      'change_request.project',
      'diagnosis.entity',
      'verification.project',
      'risk_assessment.project',
      'retrospective.org',
      'planning.org',
      'knowledge_retrieval.entity',
      'compliance_check.org',
      'knowledge_ingestion.global',
    ];

    for (const prefix of expectedRegionPrefixes) {
      const found = result.addressKeysPopulated.some((k) => k.startsWith(prefix));
      expect(found, `Expected region ${prefix} to be populated`).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // 6. Coverage Map is updated for each entry
  // -------------------------------------------------------------------------

  it('updates Coverage Map in shardC for each entry written', async () => {
    await seedBrainInstance(makeOptions());

    // shardC.set should be called once per entry (30 entries)
    expect(mockShardCSet).toHaveBeenCalledTimes(30);
  });

  it('Coverage Map keys are namespaced with brain_id and address_key', async () => {
    await seedBrainInstance(makeOptions());

    const setCalls = mockShardCSet.mock.calls;
    for (const [key] of setCalls) {
      expect(key).toMatch(new RegExp(`^coverage_map:${TEST_BRAIN_ID}:`));
    }
  });

  it('skips Coverage Map update when updateCoverageMap is false', async () => {
    await seedBrainInstance(makeOptions({ updateCoverageMap: false }));

    expect(mockShardCSet).not.toHaveBeenCalled();
    expect(mockLibrarianWrite).toHaveBeenCalledTimes(30);
  });

  // -------------------------------------------------------------------------
  // 7. Partial failure handling — errors captured, seeding continues
  // -------------------------------------------------------------------------

  it('continues seeding when one librarianWrite call fails and records the error', async () => {
    // Fail the 3rd write only
    let callCount = 0;
    mockLibrarianWrite.mockImplementation(() => {
      callCount++;
      if (callCount === 3) {
        return Promise.reject(new Error('simulated write failure'));
      }
      return Promise.resolve(undefined);
    });

    const result = await seedBrainInstance(makeOptions());

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain('simulated write failure');
    // 30 total minus 1 failure = 29 entries written
    expect(result.entriesWritten).toBe(29);
  });

  // -------------------------------------------------------------------------
  // 8. Result structure
  // -------------------------------------------------------------------------

  it('returns a well-formed SeederResult', async () => {
    const result = await seedBrainInstance(makeOptions());

    expect(result.brainId).toBe(TEST_BRAIN_ID);
    expect(result.domain).toBe(TEST_DOMAIN);
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.addressKeysPopulated)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 9. Validation — throws on bad input
  // -------------------------------------------------------------------------

  it('throws when brainId is empty', async () => {
    await expect(seedBrainInstance(makeOptions({ brainId: '' }))).rejects.toThrow(
      'brainId is required',
    );
  });

  it('throws when domain is empty', async () => {
    await expect(seedBrainInstance(makeOptions({ domain: '' }))).rejects.toThrow(
      'domain is required',
    );
  });

  // -------------------------------------------------------------------------
  // 10. Coverage Map accumulates correctly when cache already has an entry
  // -------------------------------------------------------------------------

  it('calculates rolling average confidence when Coverage Map entry already exists', async () => {
    // Simulate an existing entry with entry_count=2, avg_confidence=0.8
    mockShardCGet.mockResolvedValue(
      JSON.stringify({ entry_count: 2, avg_confidence: 0.8 }),
    );

    await seedBrainInstance(makeOptions());

    // shardC.set should still be called — confirming the update path ran
    expect(mockShardCSet).toHaveBeenCalledTimes(30);

    // Inspect the first Coverage Map write — it should average existing + new confidence
    const firstSetPayload = JSON.parse(mockShardCSet.mock.calls[0][1] as string);
    expect(firstSetPayload.entry_count).toBe(3); // 2 existing + 1 new
    expect(typeof firstSetPayload.avg_confidence).toBe('number');
  });
});
