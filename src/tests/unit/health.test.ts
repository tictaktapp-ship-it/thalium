import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@upstash/redis', () => {
  const mockRedis = {
    get: vi.fn().mockResolvedValue(null),
  };
  return { Redis: vi.fn(() => mockRedis) };
});

vi.mock('pg', () => {
  const mockPool = {
    query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    end: vi.fn().mockResolvedValue(undefined),
  };
  return { Pool: vi.fn(() => mockPool) };
});

import { checkHealth } from '../../api/health';

describe('health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy when all components respond', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const { Redis } = await import('@upstash/redis');
    const mockRedis = new (Redis as any)();
    mockRedis.get.mockResolvedValue(null);

    const result = await checkHealth();

    expect(result.status).toBe('healthy');
    expect(result.components).toHaveProperty('postgres');
    expect(result.components).toHaveProperty('redis_shard_a');
    expect(result.components).toHaveProperty('redis_shard_b');
    expect(result.components).toHaveProperty('redis_shard_c');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('app');
    expect(result).toHaveProperty('version');
  });

  it('returns down when Postgres fails', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockRejectedValue(new Error('Connection refused'));

    const result = await checkHealth();

    expect(result.status).toBe('down');
    expect(result.components.postgres.status).toBe('down');
    expect(result.components.postgres.error).toBeDefined();
  });

  it('returns down when a Redis shard fails', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockRedis = new (Redis as any)();
    mockRedis.get.mockRejectedValue(new Error('Redis unavailable'));

    const result = await checkHealth();

    expect(result.status).toBe('down');
  });

  it('all component statuses are valid values', async () => {
    const result = await checkHealth();
    const validStatuses = ['healthy', 'degraded', 'down'];

    for (const component of Object.values(result.components)) {
      expect(validStatuses).toContain(component.status);
      expect(typeof component.latency_ms).toBe('number');
    }
  });

  it('never throws — returns structured result on total failure', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockRejectedValue(new Error('DB down'));

    const { Redis } = await import('@upstash/redis');
    const mockRedis = new (Redis as any)();
    mockRedis.get.mockRejectedValue(new Error('Redis down'));

    const result = await checkHealth();

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('components');
    expect(result.status).toBe('down');
  });
});
