import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@upstash/redis', () => {
  const mockRedis = {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
  };
  return { Redis: vi.fn(() => mockRedis) };
});

vi.mock('pg', () => {
  const mockPool = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  };
  return { Pool: vi.fn(() => mockPool) };
});

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { getProviderHealth, stopHealthMonitor } from '../../jobs/health-monitor';

describe('health-monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopHealthMonitor();
  });

  it('getProviderHealth returns null on cache miss with no Postgres row', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();
    mockInstance.get.mockResolvedValueOnce(null);

    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await getProviderHealth('openrouter');
    expect(result).toBeNull();
  });

  it('getProviderHealth returns cached value from Shard C', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();
    const cached = {
      provider: 'openrouter',
      health_status: 'healthy',
      latency_ms: 120,
      last_checked_at: new Date().toISOString(),
    };
    mockInstance.get.mockResolvedValueOnce(JSON.stringify(cached));

    const result = await getProviderHealth('openrouter');
    expect(result).toMatchObject({ provider: 'openrouter', health_status: 'healthy' });
  });

  it('getProviderHealth handles Redis error and falls back gracefully', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();
    mockInstance.get.mockRejectedValueOnce(new Error('Shard C unavailable'));

    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await getProviderHealth('anthropic');
    expect(result).toBeNull();
  });

  it('stopHealthMonitor does not throw', () => {
    expect(() => stopHealthMonitor()).not.toThrow();
  });

  it('getProviderHealth parses already-parsed object from Redis', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();
    const cached = {
      provider: 'openai',
      health_status: 'degraded',
      latency_ms: 3200,
      last_checked_at: new Date().toISOString(),
    };
    // Simulate Upstash returning already-parsed object
    mockInstance.get.mockResolvedValueOnce(cached);

    const result = await getProviderHealth('openai');
    expect(result).toMatchObject({ provider: 'openai', health_status: 'degraded' });
  });
});
