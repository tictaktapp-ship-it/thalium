import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockWriteContribution, mockReadAnchor } = vi.hoisted(() => ({
  mockWriteContribution: vi.fn(),
  mockReadAnchor: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  writeContribution: mockWriteContribution,
  readAnchor: mockReadAnchor,
}));

import { interrogate, INTERROGATOR_THRESHOLD, DEFAULT_PAUSE_TIMEOUT_MINUTES } from '../../roles/interrogator';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const input = 'Build a SaaS marketplace';

describe('interrogator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteContribution.mockResolvedValue({ contributions: [] });
  });

  it('does not activate when predictionErrorScore is below threshold', async () => {
    const result = await interrogate(sessionId, input, 0.3, 'knowledge_retrieval.global.general.history');
    expect(result.activated).toBe(false);
    expect(result.questions).toEqual([]);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'interrogator', status: 'skipped' })
    );
  });

  it('activates when predictionErrorScore is at or above threshold', async () => {
    const result = await interrogate(sessionId, input, 0.7, 'knowledge_retrieval.global.general.history');
    expect(result.activated).toBe(true);
    expect(result.questions.length).toBeGreaterThanOrEqual(2);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'interrogator', status: 'complete' })
    );
  });

  it('adds specification question when addressKey starts with specification', async () => {
    const result = await interrogate(sessionId, input, 0.8, 'specification.org.software.general');
    expect(result.questions).toContain('Who will be executing this specification?');
  });

  it('adds diagnosis question when addressKey starts with diagnosis', async () => {
    const result = await interrogate(sessionId, input, 0.8, 'diagnosis.entity.software.incident');
    expect(result.questions).toContain('When did this issue first appear?');
  });

  it('returns correct pause_timeout_minutes', async () => {
    const result = await interrogate(sessionId, input, 0.8, 'diagnosis.entity.software.incident');
    expect(result.pause_timeout_minutes).toBe(DEFAULT_PAUSE_TIMEOUT_MINUTES);
  });
});
