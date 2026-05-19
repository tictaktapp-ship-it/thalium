import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockReadAnchor, mockWriteContribution, mockEvictAnchor, mockLibrarianWrite } = vi.hoisted(() => ({
  mockReadAnchor: vi.fn(),
  mockWriteContribution: vi.fn(),
  mockEvictAnchor: vi.fn(),
  mockLibrarianWrite: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  readAnchor: mockReadAnchor,
  writeContribution: mockWriteContribution,
  evictAnchor: mockEvictAnchor,
}));

vi.mock('../../lib/librarian-write', () => ({
  librarianWrite: mockLibrarianWrite,
  LibrarianError: class LibrarianError extends Error {
    constructor(public message: string, public code: string, public context?: unknown) {
      super(message);
      this.name = 'LibrarianError';
    }
  }
}));

import { runLibrarian } from '../../roles/librarian';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const brainId = '87654321-4321-4321-4321-210987654321';
const addressKey = 'specification.project.software.general';
const domain = 'software';

const validAnchor = {
  session_id: sessionId,
  brain_id: brainId,
  address_key: addressKey,
  created_at: new Date().toISOString(),
  last_refreshed_at: new Date().toISOString(),
  paused_at: null,
  pause_timeout_minutes: 10,
  contributions: [
    {
      role: 'architect',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: { structured_artifact: 'Final content', sections: [], confidence: 0.85, reasoning: 'Good' }
    },
    {
      role: 'devil',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: { challenges: [], risk_score: 0.2, missing_elements: [], verdict: 'pass', reasoning: 'OK' }
    },
    {
      role: 'interrogator',
      status: 'skipped',
      written_at: new Date().toISOString(),
      payload: { activated: false }
    }
  ]
};

describe('librarian', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadAnchor.mockResolvedValue(validAnchor);
    mockWriteContribution.mockResolvedValue({ contributions: [] });
    mockEvictAnchor.mockResolvedValue(undefined);
    mockLibrarianWrite.mockResolvedValue({ id: 'test-id' });
  });

  it('writes ring entries for all complete contributions with payload', async () => {
    const result = await runLibrarian(sessionId, brainId, addressKey, domain);
    expect(result.entries_written).toBe(2);
    expect(result.entries_failed).toBe(0);
    expect(mockLibrarianWrite).toHaveBeenCalledTimes(2);
  });

  it('skips contributions with skipped status', async () => {
    const result = await runLibrarian(sessionId, brainId, addressKey, domain);
    expect(result.entries_written).toBe(2);
  });

  it('tracks failed writes without throwing', async () => {
    mockLibrarianWrite.mockRejectedValueOnce(new Error('Write failed'));
    const result = await runLibrarian(sessionId, brainId, addressKey, domain);
    expect(result.entries_failed).toBe(1);
    expect(result.entries_written).toBe(1);
  });

  it('evicts anchor after writing entries', async () => {
    const result = await runLibrarian(sessionId, brainId, addressKey, domain);
    expect(mockEvictAnchor).toHaveBeenCalledWith(sessionId);
    expect(result.anchor_evicted).toBe(true);
  });

  it('returns anchor_evicted false when eviction fails', async () => {
    mockEvictAnchor.mockRejectedValue(new Error('Eviction failed'));
    const result = await runLibrarian(sessionId, brainId, addressKey, domain);
    expect(result.anchor_evicted).toBe(false);
  });

  it('writes librarian contribution to anchor', async () => {
    await runLibrarian(sessionId, brainId, addressKey, domain);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'librarian', status: 'complete' })
    );
  });
});
