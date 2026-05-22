import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));
const mockShardAGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockShardASet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));
const mockShardADel = vi.hoisted(() => vi.fn().mockResolvedValue(1));

vi.mock('pg', () => ({ Pool: vi.fn(() => ({ query: mockPoolQuery, connect: vi.fn().mockResolvedValue({ query: mockPoolQuery, release: vi.fn() }), end: vi.fn() })) }));
vi.mock('@upstash/redis', () => ({ Redis: vi.fn(() => ({ get: mockShardAGet, set: mockShardASet, del: mockShardADel })) }));

import { checkInvocationLimit, recordInvocation, TIER_LIMITS } from '../../lib/billing-enforcer';

describe('billing-enforcer', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockShardAGet.mockReset();
    mockShardASet.mockReset();
    mockShardADel.mockReset();
    mockPoolQuery.mockResolvedValue({ rows: [] });
    mockShardAGet.mockResolvedValue(null);
    mockShardASet.mockResolvedValue('OK');
    mockShardADel.mockResolvedValue(1);
  });

  describe('TIER_LIMITS', () => {
    it('has correct limits for each tier', () => {
      expect(TIER_LIMITS.neuron).toBe(500);
      expect(TIER_LIMITS.synapse).toBe(5000);
      expect(TIER_LIMITS.cortex).toBe(50000);
      expect(TIER_LIMITS.enterprise).toBe(Infinity);
    });
  });

  describe('checkInvocationLimit', () => {
    it('returns brain_not_found when brain does not exist', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await checkInvocationLimit('brain-001');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('brain_not_found');
    });

    it('allows invocation when under limit', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ billing_tier: 'neuron', invocation_count: 100, monthly_invocation_limit: null }] });
      const result = await checkInvocationLimit('brain-001');
      expect(result.allowed).toBe(true);
      expect(result.current_count).toBe(100);
      expect(result.limit).toBe(500);
    });

    it('blocks invocation when at limit', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ billing_tier: 'neuron', invocation_count: 500, monthly_invocation_limit: null }] });
      const result = await checkInvocationLimit('brain-001');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('monthly_limit_reached');
    });

    it('returns cached result on cache hit', async () => {
      const cached = { allowed: true, current_count: 50, limit: 500, tier: 'neuron' };
      mockShardAGet.mockResolvedValueOnce(JSON.stringify(cached));
      const result = await checkInvocationLimit('brain-001');
      expect(result.allowed).toBe(true);
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('enterprise tier allows Infinity invocations', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ billing_tier: 'enterprise', invocation_count: 999999, monthly_invocation_limit: null }] });
      const result = await checkInvocationLimit('brain-001');
      expect(result.allowed).toBe(true);
    });

    it('fails open on Redis error', async () => {
      mockShardAGet.mockRejectedValueOnce(new Error('Redis down'));
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ billing_tier: 'neuron', invocation_count: 100, monthly_invocation_limit: null }] });
      const result = await checkInvocationLimit('brain-001');
      expect(result.allowed).toBe(true);
    });
  });

  describe('recordInvocation', () => {
    it('increments invocation count and inserts ledger entry', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 1 });
      await recordInvocation('brain-001', { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150, cost_usd: 0.001 });
      expect(mockPoolQuery.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(mockShardADel).toHaveBeenCalledWith('billing_check:brain-001');
    });

    it('never throws on Postgres error', async () => {
      mockPoolQuery.mockRejectedValue(new Error('DB down'));
      await expect(recordInvocation('brain-001', { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150, cost_usd: 0.001 })).resolves.not.toThrow();
    });
  });
});


