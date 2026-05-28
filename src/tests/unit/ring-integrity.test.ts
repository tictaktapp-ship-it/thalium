import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockShardCGet, mockFetch } = vi.hoisted(() => ({
  mockShardCGet: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('../../lib/redis', () => ({
  shardA: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
  shardB: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
  shardC: { get: mockShardCGet, set: vi.fn(), del: vi.fn() },
}));

vi.stubGlobal('fetch', mockFetch);

import { runRingIntegrity } from '../../jobs/ring-integrity';

const brainId = '87654321-4321-4321-4321-210987654321';

const validEntry = {
  id: 'entry-1',
  address_key: 'specification.project.software.general',
  source: 'chain',
  entry_level: 'branch',
  superseded_by: null,
  created_at: new Date().toISOString(),
};

describe('ring-integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockShardCGet.mockResolvedValue('1');
  });

  it('returns passed report when all checks pass', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [validEntry]
    });
    const report = await runRingIntegrity(brainId);
    expect(report.passed).toBe(true);
    expect(report.checks).toHaveLength(4);
    expect(report.brain_id).toBe(brainId);
    expect(report.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('fails check 1 when address key has wrong format', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ ...validEntry, address_key: 'bad.key' }]
    });
    const report = await runRingIntegrity(brainId);
    const check1 = report.checks.find(c => c.check === 'address_key_validity');
    expect(check1?.passed).toBe(false);
    expect(report.passed).toBe(false);
  });

  it('fails check 2 when source is invalid', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ ...validEntry, source: 'invalid_source' }]
    });
    const report = await runRingIntegrity(brainId);
    const check2 = report.checks.find(c => c.check === 'write_path_source');
    expect(check2?.passed).toBe(false);
  });

  it('fails check 3 when leaf entry has superseded_by set', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [validEntry] })
      .mockResolvedValueOnce({ ok: true, json: async () => [validEntry] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ ...validEntry, entry_level: 'leaf', superseded_by: 'some-id' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    const report = await runRingIntegrity(brainId);
    const check3 = report.checks.find(c => c.check === 'leaf_immutability');
    expect(check3?.passed).toBe(false);
  });

  it('fails check 4 when coverage map entry is missing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [validEntry]
    });
    mockShardCGet.mockResolvedValue(null);
    const report = await runRingIntegrity(brainId);
    const check4 = report.checks.find(c => c.check === 'coverage_map_consistency');
    expect(check4?.passed).toBe(false);
  });
});
