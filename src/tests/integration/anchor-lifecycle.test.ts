import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockSet, mockGet, mockDel } = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockGet: vi.fn(),
  mockDel: vi.fn()
}));

vi.mock('../../lib/redis', () => ({
  shardA: {
    set: mockSet,
    get: mockGet,
    del: mockDel
  }
}));

import { createAnchor, readAnchor, writeContribution, evictAnchor } from '../../lib/anchor';
import { LibrarianError } from '../../lib/librarian-write';

const SESSION_ID = '12345678-1234-1234-1234-123456789012';
const BRAIN_ID = '87654321-4321-4321-4321-210987654321';
const ADDRESS_KEY = 'specification.org.software.general';

const validAnchor = {
  session_id: SESSION_ID,
  brain_id: BRAIN_ID,
  address_key: ADDRESS_KEY,
  created_at: new Date().toISOString(),
  last_refreshed_at: new Date().toISOString(),
  contributions: [],
  paused_at: null,
  pause_timeout_minutes: 10
};

describe('anchor lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAnchor creates correct initial state', async () => {
    mockSet.mockResolvedValue('OK');
    const result = await createAnchor(SESSION_ID, BRAIN_ID, ADDRESS_KEY);
    expect(result.session_id).toBe(SESSION_ID);
    expect(result.brain_id).toBe(BRAIN_ID);
    expect(result.address_key).toBe(ADDRESS_KEY);
    expect(result.contributions).toEqual([]);
    expect(result.paused_at).toBeNull();
    expect(result.pause_timeout_minutes).toBe(10);
  });

  it('readAnchor returns the anchor that was created', async () => {
    mockGet.mockResolvedValue(JSON.stringify(validAnchor));
    const result = await readAnchor(SESSION_ID);
    expect(result.session_id).toBe(SESSION_ID);
    expect(result.brain_id).toBe(BRAIN_ID);
  });

  it('readAnchor throws VALIDATION_FAILED when anchor does not exist', async () => {
    mockGet.mockResolvedValue(null);
    try {
      await readAnchor(SESSION_ID);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('writeContribution appends contribution correctly', async () => {
    mockGet.mockResolvedValue(JSON.stringify(validAnchor));
    mockSet.mockResolvedValue('OK');
    const contribution = {
      role: 'triage' as const,
      status: 'complete' as const,
      written_at: new Date().toISOString(),
      payload: { test: true }
    };
    const result = await writeContribution(SESSION_ID, contribution);
    expect(result.contributions).toHaveLength(1);
    expect(result.contributions[0]?.role).toBe('triage');
  });

  it('evictAnchor deletes the anchor', async () => {
    mockDel.mockResolvedValue(1);
    await evictAnchor(SESSION_ID);
    expect(mockDel).toHaveBeenCalledWith(`anc_${SESSION_ID}`);
  });
});
