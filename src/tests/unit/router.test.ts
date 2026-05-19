import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockShardCGet, mockShardCSet, mockShardCDel, mockShardCKeys } = vi.hoisted(() => ({
  mockShardCGet: vi.fn(),
  mockShardCSet: vi.fn(),
  mockShardCDel: vi.fn(),
  mockShardCKeys: vi.fn(),
}));

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('../../lib/redis', () => ({
  shardC: {
    get: mockShardCGet,
    set: mockShardCSet,
    del: mockShardCDel,
    keys: mockShardCKeys,
  }
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  }))
}));

import { selectModel, markCircuitBreaker, clearCircuitBreaker } from '../../roles/router';
import { LibrarianError } from '../../lib/librarian-write';

const healthyModel = { provider: 'anthropic', model_id: 'claude-3-haiku', health_status: 'healthy' };

describe('router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockShardCKeys.mockResolvedValue([]);
  });

  it('selectModel returns healthy model from cache', async () => {
    mockShardCGet.mockResolvedValue([healthyModel]);
    const result = await selectModel('specification', 'software');
    expect(result.selected.provider).toBe('anthropic');
    expect(result.fallback_used).toBe(false);
    expect(result.circuit_breaker_active).toBe(false);
  });

  it('selectModel falls back to Supabase when cache miss', async () => {
    mockShardCGet.mockResolvedValue(null);
    mockShardCSet.mockResolvedValue('OK');
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [healthyModel], error: null })
          })
        })
      })
    });
    const result = await selectModel('specification', 'software');
    expect(result.selected.provider).toBeDefined();
    expect(result.fallback_used).toBe(false);
  });

  it('selectModel throws WRITE_FAILED when no models available', async () => {
    mockShardCGet.mockResolvedValue([]);
    try {
      await selectModel('specification', 'software');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('WRITE_FAILED');
    }
  });

  it('markCircuitBreaker sets the circuit breaker key', async () => {
    mockShardCSet.mockResolvedValue('OK');
    await markCircuitBreaker('anthropic');
    expect(mockShardCSet).toHaveBeenCalledWith(
      expect.stringContaining('circuit_breaker:anthropic'),
      expect.anything(),
      expect.anything()
    );
  });

  it('clearCircuitBreaker deletes the circuit breaker key', async () => {
    mockShardCDel.mockResolvedValue(1);
    await clearCircuitBreaker('anthropic');
    expect(mockShardCDel).toHaveBeenCalledWith(
      expect.stringContaining('circuit_breaker:anthropic')
    );
  });
});
