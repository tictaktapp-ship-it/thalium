import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }));

vi.mock('pg', () => ({ Pool: vi.fn(() => ({ query: mockPoolQuery, connect: vi.fn().mockResolvedValue({ query: mockPoolQuery, release: vi.fn() }), end: vi.fn() })) }));

import { runArchiverPass, stopArchiver } from '../../jobs/archiver';

describe('archiver', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  afterEach(() => {
    stopArchiver();
  });

  it('stopArchiver does not throw', () => {
    expect(() => stopArchiver()).not.toThrow();
  });

  it('runArchiverPass returns zero counts when nothing to archive', async () => {
    mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 });
    const result = await runArchiverPass('brain-001');
    expect(result.brain_id).toBe('brain-001');
    expect(result.artifacts_archived).toBe(0);
    expect(result.ring_entries_archived).toBe(0);
    expect(result).toHaveProperty('duration_ms');
  });

  it('runArchiverPass returns correct counts when entries archived', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'a1' }, { id: 'a2' }], rowCount: 2 }) // artifacts
      .mockResolvedValueOnce({ rows: [{ id: 'r1' }], rowCount: 1 }) // ring entries
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // audit log
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

    const result = await runArchiverPass('brain-001');
    expect(result.artifacts_archived).toBe(2);
    expect(result.ring_entries_archived).toBe(1);
  });

  it('never throws on Postgres error — returns zero result', async () => {
    mockPoolQuery.mockRejectedValue(new Error('DB down'));
    const result = await runArchiverPass('brain-999');
    expect(result.brain_id).toBe('brain-999');
    expect(result).toHaveProperty('duration_ms');
  });
});
