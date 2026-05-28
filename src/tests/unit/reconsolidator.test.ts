import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
  release: vi.fn(),
}));

vi.mock('pg', () => {
  const mockPool = {
    connect: vi.fn().mockResolvedValue(mockClient),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  };
  return { Pool: vi.fn(() => mockPool) };
});

vi.mock('../../lib/librarian-write', () => ({
  librarianWrite: vi.fn().mockResolvedValue({ id: 'new-entry-id' }),
}));

import { runReconsolidator } from '../../jobs/reconsolidator';
import { librarianWrite } from '../../lib/librarian-write';

describe('reconsolidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.query.mockResolvedValue({ rows: [] });
  });

  it('returns zero counts when no flagged entries exist', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const result = await runReconsolidator('brain-001');

    expect(result.entries_processed).toBe(0);
    expect(result.entries_refiled).toBe(0);
    expect(result.entries_contested).toBe(0);
    expect(result.brain_id).toBe('brain-001');
  });

  it('refiles entry with low confidence and non-general specificity', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'entry-001',
          brain_id: 'brain-001',
          address_key: 'diagnosis.entity.software.defect',
          content: { text: 'some content' },
          entry_level: 'leaf',
          avg_confidence: 0.3,
          refiling_count: 0,
          refiling_history: [],
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await runReconsolidator('brain-001');

    expect(result.entries_refiled).toBe(1);
    expect(librarianWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        address_key: 'diagnosis.entity.software.general',
        source: 'calibrator',
      })
    );
  });

  it('marks entry contested at refiling_count 2', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'entry-002',
          brain_id: 'brain-001',
          address_key: 'diagnosis.entity.software.defect',
          content: { text: 'some content' },
          entry_level: 'leaf',
          avg_confidence: 0.3,
          refiling_count: 2,
          refiling_history: ['diagnosis.entity.software.incident', 'diagnosis.entity.software.general'],
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await runReconsolidator('brain-001');

    expect(result.entries_contested).toBe(1);
    expect(result.entries_refiled).toBe(0);
  });

  it('skips entry with high confidence', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'entry-003',
          brain_id: 'brain-001',
          address_key: 'diagnosis.entity.software.defect',
          content: { text: 'some content' },
          entry_level: 'leaf',
          avg_confidence: 0.8,
          refiling_count: 0,
          refiling_history: [],
        }],
      });

    const result = await runReconsolidator('brain-001');

    expect(result.entries_skipped).toBe(1);
    expect(librarianWrite).not.toHaveBeenCalled();
  });

  it('never throws — returns result on Postgres error', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.connect.mockRejectedValueOnce(new Error('DB connection failed'));

    const result = await runReconsolidator('brain-999');

    expect(result).toHaveProperty('entries_processed');
    expect(result).toHaveProperty('duration_ms');
    expect(result.brain_id).toBe('brain-999');
  });
});
