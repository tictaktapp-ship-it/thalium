import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockReadAnchor, mockWriteContribution, mockShardCGet } = vi.hoisted(() => ({
  mockReadAnchor: vi.fn(),
  mockWriteContribution: vi.fn(),
  mockShardCGet: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  readAnchor: mockReadAnchor,
  writeContribution: mockWriteContribution,
}));

vi.mock('../../lib/redis', () => ({
  shardC: { get: mockShardCGet }
}));

import { score, DEFAULT_PASS_THRESHOLD } from '../../roles/scorer';
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
      payload: { confidence: 0.85, sections: ['Section 1'], structured_artifact: 'Test', reasoning: 'Good' }
    },
    {
      role: 'devil',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: { challenges: [], risk_score: 0.2, missing_elements: [], verdict: 'pass', reasoning: 'Looks good' }
    }
  ]
};

describe('scorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteContribution.mockResolvedValue({ contributions: [] });
    mockShardCGet.mockResolvedValue(null);
    mockReadAnchor.mockResolvedValue(validAnchor);
  });

  it('score returns ScorerResult with confidence_score and gate_decision', async () => {
    const result = await score(sessionId, brainId, addressKey);
    expect(result.output.confidence_score).toBeGreaterThanOrEqual(0);
    expect(result.output.confidence_score).toBeLessThanOrEqual(100);
    expect(['pass', 'fail', 'pass_with_warning']).toContain(result.output.gate_decision);
    expect(result.anchor_contribution.role).toBe('scorer');
    expect(result.anchor_contribution.status).toBe('complete');
  });

  it('score produces pass gate_decision when confidence is high and devil passes', async () => {
    const result = await score(sessionId, brainId, addressKey);
    expect(result.output.gate_decision).toBe('pass');
  });

  it('score produces fail gate_decision when devil verdict is fail', async () => {
    mockReadAnchor.mockResolvedValue({
      ...validAnchor,
      contributions: [
        ...validAnchor.contributions.slice(0, 1),
        {
          role: 'devil',
          status: 'complete',
          written_at: new Date().toISOString(),
          payload: { challenges: ['Critical flaw'], risk_score: 0.9, missing_elements: [], verdict: 'fail', reasoning: 'Fails' }
        }
      ]
    });
    const result = await score(sessionId, brainId, addressKey);
    expect(result.output.gate_decision).toBe('fail');
  });

  it('score throws VALIDATION_FAILED when architect contribution is missing', async () => {
    mockReadAnchor.mockResolvedValue({
      ...validAnchor,
      contributions: []
    });
    try {
      await score(sessionId, brainId, addressKey);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('MISSING_CONTRIBUTIONS');
    }
  });

  it('score calls writeContribution with scorer contribution', async () => {
    await score(sessionId, brainId, addressKey);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'scorer', status: 'complete' })
    );
  });
});
