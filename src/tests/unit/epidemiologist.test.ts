import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('pg', () => {
  const mockPool = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  };
  return { Pool: vi.fn(() => mockPool) };
});

import { runEpidemiologistAnalysis, stopEpidemiologist } from '../../jobs/epidemiologist';

describe('epidemiologist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopEpidemiologist();
  });

  it('returns empty arrays when no findings', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValue({ rows: [] });

    const report = await runEpidemiologistAnalysis('brain-001');

    expect(report.brain_id).toBe('brain-001');
    expect(report.decay).toHaveLength(0);
    expect(report.drift).toHaveLength(0);
    expect(report.concentration).toHaveLength(0);
    expect(report).toHaveProperty('analysed_at');
    expect(report).toHaveProperty('duration_ms');
  });

  it('returns decay entries when found', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{
          address_key: 'diagnosis.entity.software.defect',
          decaying_count: 5,
          avg_confidence: 0.4,
          oldest_accessed_at: '2026-01-01T00:00:00Z',
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const report = await runEpidemiologistAnalysis('brain-001');

    expect(report.decay).toHaveLength(1);
    expect(report.decay[0].address_key).toBe('diagnosis.entity.software.defect');
    expect(report.decay[0].decaying_count).toBe(5);
  });

  it('returns drift entries when found', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          address_key: 'specification.project.software.requirements',
          recent_avg: 0.55,
          prior_avg: 0.75,
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const report = await runEpidemiologistAnalysis('brain-001');

    expect(report.drift).toHaveLength(1);
    expect(report.drift[0].decline).toBeCloseTo(-0.2, 1);
  });

  it('returns concentration entries when found', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          prefix: 'diagnosis.entity',
          entry_count: 650,
          percentage: 65.0,
        }],
      });

    const report = await runEpidemiologistAnalysis('brain-001');

    expect(report.concentration).toHaveLength(1);
    expect(report.concentration[0].prefix).toBe('diagnosis.entity');
    expect(report.concentration[0].percentage).toBe(65.0);
  });

  it('never throws on Postgres error — returns empty arrays', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockRejectedValue(new Error('DB unavailable'));

    const report = await runEpidemiologistAnalysis('brain-999');

    expect(report.brain_id).toBe('brain-999');
    expect(report.decay).toHaveLength(0);
    expect(report.drift).toHaveLength(0);
    expect(report.concentration).toHaveLength(0);
  });

  it('stopEpidemiologist does not throw', () => {
    expect(() => stopEpidemiologist()).not.toThrow();
  });
});
