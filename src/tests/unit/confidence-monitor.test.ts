import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @upstash/redis
vi.mock('@upstash/redis', () => {
  const mockRedis = {
    lpush: vi.fn().mockResolvedValue(1),
    ltrim: vi.fn().mockResolvedValue('OK'),
    expire: vi.fn().mockResolvedValue(1),
    lrange: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  };
  return { Redis: vi.fn(() => mockRedis) };
});

// Mock pg
vi.mock('pg', () => {
  const mockPool = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  };
  return { Pool: vi.fn(() => mockPool) };
});

import { recordConfidenceSample, stopConfidenceMonitor } from '../../jobs/confidence-monitor';

describe('confidence-monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopConfidenceMonitor();
  });

  it('recordConfidenceSample pushes a sample to Shard A', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();

    await recordConfidenceSample('brain-001', 78);

    expect(mockInstance.lpush).toHaveBeenCalledWith(
      'confidence_samples:brain-001',
      expect.stringContaining('"score":78')
    );
  });

  it('recordConfidenceSample trims list to 200 entries', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();

    await recordConfidenceSample('brain-001', 78);

    expect(mockInstance.ltrim).toHaveBeenCalledWith(
      'confidence_samples:brain-001',
      0,
      199
    );
  });

  it('recordConfidenceSample sets TTL on the list key', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();

    await recordConfidenceSample('brain-002', 55);

    expect(mockInstance.expire).toHaveBeenCalledWith(
      'confidence_samples:brain-002',
      600
    );
  });

  it('stopConfidenceMonitor does not throw', () => {
    expect(() => stopConfidenceMonitor()).not.toThrow();
  });

  it('recordConfidenceSample handles Redis error gracefully', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();
    mockInstance.lpush.mockRejectedValueOnce(new Error('Redis connection failed'));

    await expect(recordConfidenceSample('brain-003', 70)).resolves.not.toThrow();
  });

  it('recordConfidenceSample sample JSON contains recorded_at', async () => {
    const { Redis } = await import('@upstash/redis');
    const mockInstance = new (Redis as any)();

    await recordConfidenceSample('brain-004', 82);

    const call = mockInstance.lpush.mock.calls[0];
    const sample = JSON.parse(call[1]);
    expect(sample).toHaveProperty('recorded_at');
    expect(sample).toHaveProperty('score', 82);
  });
});
