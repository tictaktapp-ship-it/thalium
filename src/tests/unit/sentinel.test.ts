import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('pg', () => {
  const mockPool = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  };
  return { Pool: vi.fn(() => mockPool) };
});

import { runSentinelChecks, stopSentinel } from '../../jobs/sentinel';

describe('sentinel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopSentinel();
  });

  it('returns empty anomalies when all checks pass', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValue({ rows: [] });

    const report = await runSentinelChecks('brain-001');

    expect(report.brain_id).toBe('brain-001');
    expect(report.anomalies).toHaveLength(0);
    expect(report).toHaveProperty('checked_at');
    expect(report).toHaveProperty('duration_ms');
  });

  it('detects confidence drift anomaly', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ address_key: 'diagnosis.entity.software.defect', region_avg: 0.3 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const report = await runSentinelChecks('brain-001');

    expect(report.anomalies).toHaveLength(1);
    expect(report.anomalies[0].type).toBe('confidence_drift');
    expect(report.anomalies[0].severity).toBe('warn');
  });

  it('detects velocity spike anomaly', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ prefix: 'diagnosis.entity.software', entry_count: 250 }] })
      .mockResolvedValueOnce({ rows: [] });

    const report = await runSentinelChecks('brain-001');

    expect(report.anomalies).toHaveLength(1);
    expect(report.anomalies[0].type).toBe('velocity_spike');
    expect(report.anomalies[0].severity).toBe('critical');
  });

  it('detects coverage gap anomaly', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ address_key: 'specification.project.software.requirements' }] });

    const report = await runSentinelChecks('brain-001');

    expect(report.anomalies).toHaveLength(1);
    expect(report.anomalies[0].type).toBe('coverage_gap');
    expect(report.anomalies[0].severity).toBe('critical');
  });

  it('never throws on Postgres error — returns report with error anomaly', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockRejectedValue(new Error('DB unavailable'));

    const report = await runSentinelChecks('brain-999');

    expect(report.brain_id).toBe('brain-999');
    expect(report.anomalies.length).toBeGreaterThan(0);
  });

  it('stopSentinel does not throw', () => {
    expect(() => stopSentinel()).not.toThrow();
  });
});
