import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockWriteContribution, mockFetch } = vi.hoisted(() => ({
  mockWriteContribution: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  writeContribution: mockWriteContribution,
}));

vi.stubGlobal('fetch', mockFetch);

import { devil, buildDevilPrompt } from '../../roles/devil';
import { LibrarianError } from '../../lib/librarian-write';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const validInput = 'Build a SaaS marketplace';
const validArtifact = 'The marketplace will have user auth, listings, and payments.';
const validIntentType = 'specification';
const validDomain = 'software';

const mockDevilResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        challenges: ['No error handling specified', 'Missing rate limiting'],
        risk_score: 0.4,
        missing_elements: ['Security requirements', 'Performance targets'],
        verdict: 'pass_with_concerns',
        reasoning: 'The artifact covers core functionality but lacks non-functional requirements.'
      })
    }
  }]
};

describe('devil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key';
    mockWriteContribution.mockResolvedValue({ contributions: [] });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDevilResponse
    });
  });

  it('buildDevilPrompt returns string containing input and artifact', () => {
    const prompt = buildDevilPrompt(validInput, validArtifact, validIntentType, validDomain);
    expect(prompt).toContain(validInput);
    expect(prompt).toContain(validArtifact);
    expect(prompt).toContain(validIntentType);
  });

  it('devil throws VALIDATION_FAILED when input is empty string', async () => {
    try {
      await devil(sessionId, '', validArtifact, validIntentType, validDomain);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('devil throws VALIDATION_FAILED when architectArtifact is empty string', async () => {
    try {
      await devil(sessionId, validInput, '', validIntentType, validDomain);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('devil returns DevilResult with challenges and verdict on valid input', async () => {
    const result = await devil(sessionId, validInput, validArtifact, validIntentType, validDomain);
    expect(Array.isArray(result.output.challenges)).toBe(true);
    expect(result.output.risk_score).toBeGreaterThanOrEqual(0);
    expect(result.output.risk_score).toBeLessThanOrEqual(1);
    expect(['pass', 'pass_with_concerns', 'fail']).toContain(result.output.verdict);
    expect(result.anchor_contribution.role).toBe('devil');
    expect(result.anchor_contribution.status).toBe('complete');
  });

  it('devil calls writeContribution with sessionId and devil contribution', async () => {
    await devil(sessionId, validInput, validArtifact, validIntentType, validDomain);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'devil', status: 'complete' })
    );
  });
});
