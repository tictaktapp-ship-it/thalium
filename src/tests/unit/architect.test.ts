import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockWriteContribution, mockReadAnchor, mockFetch } = vi.hoisted(() => ({
  mockWriteContribution: vi.fn(),
  mockReadAnchor: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  writeContribution: mockWriteContribution,
  readAnchor: mockReadAnchor,
}));

vi.stubGlobal('fetch', mockFetch);

import { architect, buildArchitectPrompt } from '../../roles/architect';
import { LibrarianError } from '../../lib/librarian-write';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const validInput = 'Build a SaaS marketplace';
const validIntentType = 'specification';
const validDomain = 'software';
const validAddressKey = 'specification.project.software.general';

const mockOpenRouterResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        structured_artifact: 'Test artifact content',
        sections: ['Section 1', 'Section 2'],
        confidence: 0.85,
        reasoning: 'Test reasoning'
      })
    }
  }]
};

describe('architect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key';
    mockWriteContribution.mockResolvedValue({ contributions: [] });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockOpenRouterResponse
    });
  });

  it('buildArchitectPrompt returns string containing input, intentType and domain', () => {
    const prompt = buildArchitectPrompt(validInput, validIntentType, validDomain);
    expect(prompt).toContain(validInput);
    expect(prompt).toContain(validIntentType);
    expect(prompt).toContain(validDomain);
  });

  it('architect throws VALIDATION_FAILED when input is empty string', async () => {
    try {
      await architect(sessionId, '', validAddressKey, validIntentType, validDomain);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('architect throws VALIDATION_FAILED when intentType is empty string', async () => {
    try {
      await architect(sessionId, validInput, validAddressKey, '', validDomain);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('architect returns structured ArchitectResult on valid input', async () => {
    const result = await architect(sessionId, validInput, validAddressKey, validIntentType, validDomain);
    expect(result.output.structured_artifact).toBeDefined();
    expect(Array.isArray(result.output.sections)).toBe(true);
    expect(result.output.confidence).toBeGreaterThanOrEqual(0);
    expect(result.output.confidence).toBeLessThanOrEqual(1);
    expect(result.anchor_contribution.role).toBe('architect');
    expect(result.anchor_contribution.status).toBe('complete');
  });

  it('architect calls writeContribution with sessionId and contribution', async () => {
    await architect(sessionId, validInput, validAddressKey, validIntentType, validDomain);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'architect', status: 'complete' })
    );
  });
});
