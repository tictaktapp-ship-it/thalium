import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockReadAnchor, mockWriteContribution } = vi.hoisted(() => ({
  mockReadAnchor: vi.fn(),
  mockWriteContribution: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  readAnchor: mockReadAnchor,
  writeContribution: mockWriteContribution,
}));

import { scribe } from '../../roles/scribe';
import { LibrarianError } from '../../lib/librarian-write';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const brainId = '87654321-4321-4321-4321-210987654321';
const addressKey = 'specification.project.software.general';

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
      payload: { structured_artifact: 'Final artifact content', sections: [], confidence: 0.85, reasoning: 'Good' }
    },
    {
      role: 'scorer',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: { confidence_score: 80, gate_decision: 'pass', score_breakdown: {}, reasoning: 'Passed' }
    }
  ]
};

describe('scribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteContribution.mockResolvedValue({ contributions: [] });
    mockReadAnchor.mockResolvedValue(validAnchor);
  });

  it('returns ScribeResult with complete artifact', async () => {
    const result = await scribe(sessionId, brainId, addressKey);
    expect(result.artifact.session_id).toBe(sessionId);
    expect(result.artifact.brain_id).toBe(brainId);
    expect(result.artifact.status).toBe('complete');
    expect(result.artifact.address_key).toBe(addressKey);
    expect(result.artifact.confidence_score).toBe(80);
    expect(result.artifact.gate_decision).toBe('pass');
  });

  it('artifact contains anchor_trace with all contributions', async () => {
    const result = await scribe(sessionId, brainId, addressKey);
    expect(result.artifact.anchor_trace.length).toBeGreaterThanOrEqual(2);
    const roles = result.artifact.anchor_trace.map(t => t.role);
    expect(roles).toContain('architect');
    expect(roles).toContain('scorer');
  });

  it('writes scribe contribution to anchor', async () => {
    await scribe(sessionId, brainId, addressKey);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'scribe', status: 'complete' })
    );
  });

  it('throws VALIDATION_FAILED when architect contribution is missing', async () => {
    mockReadAnchor.mockResolvedValue({ ...validAnchor, contributions: [] });
    try {
      await scribe(sessionId, brainId, addressKey);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('throws VALIDATION_FAILED when scorer contribution is missing', async () => {
    mockReadAnchor.mockResolvedValue({
      ...validAnchor,
      contributions: [validAnchor.contributions[0]]
    });
    try {
      await scribe(sessionId, brainId, addressKey);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });
});
