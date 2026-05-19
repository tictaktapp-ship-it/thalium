import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('redis module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('configuration errors', () => {
    it('throws when REDIS_SHARD_A_URL is missing', async () => {
      delete process.env.REDIS_SHARD_A_URL;
      try {
        await import('../../lib/redis');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('REDIS_SHARD_A_URL');
        expect((err as Error).name).toBe('RedisConfigError');
      }
    });

    it('throws when REDIS_SHARD_B_TOKEN is missing', async () => {
      delete process.env.REDIS_SHARD_B_TOKEN;
      try {
        await import('../../lib/redis');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('REDIS_SHARD_B_TOKEN');
        expect((err as Error).name).toBe('RedisConfigError');
      }
    });

    it('sets shard property to A when Shard A config is missing', async () => {
      delete process.env.REDIS_SHARD_A_URL;
      try {
        await import('../../lib/redis');
        expect.fail('should have thrown');
      } catch (err) {
        expect((err as { shard: string }).shard).toBe('A');
      }
    });
  });

  describe('successful initialization', () => {
    it('initializes all shards when all env vars are present', async () => {
      const redis = await import('../../lib/redis');
      expect(redis.shardA).toBeDefined();
      expect(redis.shardB).toBeDefined();
      expect(redis.shardC).toBeDefined();
    });
  });

  describe('getShardName', () => {
    it('returns correct shard names using actual shard references', async () => {
      const { shardA, shardB, shardC, getShardName } = await import('../../lib/redis');
      expect(getShardName(shardA)).toBe('A');
      expect(getShardName(shardB)).toBe('B');
      expect(getShardName(shardC)).toBe('C');
    });
  });
});
