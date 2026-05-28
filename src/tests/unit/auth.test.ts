import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));
const mockShardBIncr = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockShardBExpire = vi.hoisted(() => vi.fn().mockResolvedValue(1));

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({ query: mockPoolQuery, end: vi.fn() })),
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({ incr: mockShardBIncr, expire: mockShardBExpire })),
}));

import { validateApiKey, hasScope, checkRateLimit, hashApiKey } from '../../lib/auth';

describe('auth', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockShardBIncr.mockReset();
    mockShardBExpire.mockReset();
    mockPoolQuery.mockResolvedValue({ rows: [] });
    mockShardBIncr.mockResolvedValue(1);
    mockShardBExpire.mockResolvedValue(1);
  });

  describe('hashApiKey', () => {
    it('returns a 64-char hex string', () => {
      const hash = hashApiKey('test-api-key');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('is deterministic', () => {
      expect(hashApiKey('my-key')).toBe(hashApiKey('my-key'));
    });

    it('produces different hashes for different keys', () => {
      expect(hashApiKey('key-a')).not.toBe(hashApiKey('key-b'));
    });
  });

  describe('validateApiKey', () => {
    it('returns null when key not found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const result = await validateApiKey('bad-key');
      expect(result).toBeNull();
    });

    it('returns ApiKeyRecord when key is valid', async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{
          id: 'key-001',
          brain_id: 'brain-001',
          scopes: ['invoke', 'memory:read'],
          rate_limit_per_minute: 60,
          expires_at: null,
          revoked_at: null,
        }],
      });

      const result = await validateApiKey('valid-key');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('key-001');
      expect(result?.scopes).toContain('invoke');
    });

    it('returns null on Postgres error (fail closed)', async () => {
      mockPoolQuery.mockRejectedValueOnce(new Error('DB down'));
      const result = await validateApiKey('any-key');
      expect(result).toBeNull();
    });
  });

  describe('hasScope', () => {
    const record = {
      id: 'k1', brain_id: 'b1',
      scopes: ['invoke', 'memory:read'],
      rate_limit_per_minute: 60,
      expires_at: null, revoked_at: null,
    };

    it('returns true when scope present', () => {
      expect(hasScope(record, 'invoke')).toBe(true);
    });

    it('returns false when scope absent', () => {
      expect(hasScope(record, 'memory:admin')).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('allows request when under limit', async () => {
      mockShardBIncr.mockResolvedValueOnce(5);

      const result = await checkRateLimit('key-001', 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(55);
    });

    it('blocks request when over limit', async () => {
      mockShardBIncr.mockResolvedValueOnce(61);

      const result = await checkRateLimit('key-001', 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('sets TTL on first increment', async () => {
      mockShardBIncr.mockResolvedValueOnce(1);

      await checkRateLimit('key-001', 60);

      expect(mockShardBExpire).toHaveBeenCalledWith(expect.any(String), 120);
    });

    it('fails open on Redis error', async () => {
      mockShardBIncr.mockRejectedValueOnce(new Error('Redis down'));

      const result = await checkRateLimit('key-001', 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
  });
});
