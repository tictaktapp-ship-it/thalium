import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockShardAGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockShardAIncr = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockShardADel = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockShardCGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockShardCSet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));
const mockShardCDel = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }));
const redisCallCount = vi.hoisted(() => ({ value: 0 }));

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({ query: mockPoolQuery }))
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => {
    redisCallCount.value++;
    if (redisCallCount.value === 1) {
      return { get: mockShardAGet, incr: mockShardAIncr, del: mockShardADel, set: vi.fn() };
    }
    return { get: mockShardCGet, set: mockShardCSet, del: mockShardCDel, incr: vi.fn() };
  })
}));

import { checkAndIncrementInvocation, recordInvocationLedger, invalidateSubscriptionCache } from '../../lib/billing-enforcer';

const ACTIVE_SUB = {
  id: '11111111-1111-1111-1111-111111111111',
  org_id: '22222222-2222-2222-2222-222222222222',
  plan: 'neuron',
  status: 'active',
  invocation_limit: 3500,
  overage_enabled: false
};

describe('billing-enforcer', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockShardAGet.mockReset();
    mockShardAIncr.mockReset();
    mockShardADel.mockReset();
    mockShardCGet.mockReset();
    mockShardCSet.mockReset();
    mockShardCDel.mockReset();
    mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 });
    mockShardAGet.mockResolvedValue(null);
    mockShardAIncr.mockResolvedValue(1);
    mockShardCGet.mockResolvedValue(null);
    mockShardCSet.mockResolvedValue('OK');
    mockShardCDel.mockResolvedValue(1);
  });

  describe('checkAndIncrementInvocation', () => {
    it('allows invocation when under limit', async () => {
      mockShardCGet.mockResolvedValueOnce(ACTIVE_SUB);
      mockShardAGet.mockResolvedValueOnce(100);
      mockShardAIncr.mockResolvedValueOnce(101);
      const result = await checkAndIncrementInvocation('brain-001', 'org-001');
      expect(result.allowed).toBe(true);
      expect(result.is_overage).toBe(false);
      expect(result.current_count).toBe(101);
      expect(result.limit).toBe(3500);
    });

    it('blocks invocation when at limit and overage disabled', async () => {
      mockShardCGet.mockResolvedValueOnce({ ...ACTIVE_SUB, invocation_limit: 3500, overage_enabled: false });
      mockShardAGet.mockResolvedValueOnce(3500);
      const result = await checkAndIncrementInvocation('brain-001', 'org-001');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('allocation_exhausted');
      expect(result.current_count).toBe(3500);
    });

    it('allows overage when overage_enabled is true', async () => {
      mockShardCGet.mockResolvedValueOnce({ ...ACTIVE_SUB, overage_enabled: true });
      mockShardAGet.mockResolvedValueOnce(3500);
      mockShardAIncr.mockResolvedValueOnce(3501);
      const result = await checkAndIncrementInvocation('brain-001', 'org-001');
      expect(result.allowed).toBe(true);
      expect(result.is_overage).toBe(true);
    });

    it('studio plan with null limit allows unlimited invocations', async () => {
      mockShardCGet.mockResolvedValueOnce({ ...ACTIVE_SUB, plan: 'studio', invocation_limit: null });
      mockShardAGet.mockResolvedValueOnce(99999);
      mockShardAIncr.mockResolvedValueOnce(100000);
      const result = await checkAndIncrementInvocation('brain-001', 'org-001');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100000);
    });

    it('falls open when no active subscription found', async () => {
      mockShardCGet.mockResolvedValueOnce(null);
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const result = await checkAndIncrementInvocation('brain-001', 'org-001');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('error_fail_open');
    });

    it('falls open on Redis error', async () => {
      mockShardCGet.mockRejectedValueOnce(new Error('Redis down'));
      const result = await checkAndIncrementInvocation('brain-001', 'org-001');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('error_fail_open');
    });

    it('fetches subscription from Postgres on cache miss', async () => {
      mockShardCGet.mockResolvedValueOnce(null);
      mockPoolQuery.mockResolvedValueOnce({ rows: [ACTIVE_SUB], rowCount: 1 });
      mockShardAGet.mockResolvedValueOnce(0);
      mockShardAIncr.mockResolvedValueOnce(1);
      const result = await checkAndIncrementInvocation('brain-001', 'org-001');
      expect(result.allowed).toBe(true);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordInvocationLedger', () => {
    it('inserts a row into invocation_ledger', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      await recordInvocationLedger({ brainId: 'brain-001', orgId: 'org-001', invocationId: 'inv-001', isOverage: false });
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
      expect(mockPoolQuery.mock.calls[0]![0]).toContain('INSERT INTO invocation_ledger');
    });

    it('includes model cost when provided', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      await recordInvocationLedger({ brainId: 'brain-001', orgId: 'org-001', invocationId: 'inv-001', isOverage: true, modelCostGbp: 0.005 });
      expect(mockPoolQuery.mock.calls[0]![1]).toContain(0.005);
    });

    it('never throws on Postgres error', async () => {
      mockPoolQuery.mockRejectedValueOnce(new Error('DB down'));
      await expect(recordInvocationLedger({ brainId: 'brain-001', orgId: 'org-001', invocationId: 'inv-001', isOverage: false })).resolves.not.toThrow();
    });
  });

  describe('invalidateSubscriptionCache', () => {
    it('deletes the subscription cache key from Shard C', async () => {
      await invalidateSubscriptionCache('org-001');
      expect(mockShardCDel).toHaveBeenCalledWith('sub_cache:org-001');
    });

    it('never throws on Redis error', async () => {
      mockShardCDel.mockRejectedValueOnce(new Error('Redis down'));
      await expect(invalidateSubscriptionCache('org-001')).resolves.not.toThrow();
    });
  });
});
