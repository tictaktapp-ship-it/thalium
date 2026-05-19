import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockFetch = vi.hoisted(() => {
  const fn = vi.fn();
  vi.stubGlobal('fetch', fn);
  return fn;
});

import { triage, buildClassificationPrompt } from '../../roles/triage';
import { LibrarianError } from '../../lib/librarian-write';

const validBrainId = '123e4567-e89b-12d3-a456-426614174000';

const makeOpenRouterResponse = (content: unknown) => ({
  ok: true,
  json: () => Promise.resolve({
    choices: [{ message: { content: JSON.stringify(content) } }]
  })
});

describe('triage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  describe('buildClassificationPrompt', () => {
    it('returns a string containing the input and domain', () => {
      const prompt = buildClassificationPrompt('Build a SaaS marketplace', 'software');
      expect(prompt).toContain('Build a SaaS marketplace');
      expect(prompt).toContain('software');
      expect(prompt).toContain('specification');
      expect(prompt).toContain('change_request');
      expect(prompt).toContain('diagnosis');
    });
  });

  describe('triage', () => {
    it('throws VALIDATION_FAILED when input is empty string', async () => {
      try {
        await triage('', validBrainId, 'software');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
      }
    });

    it('throws VALIDATION_FAILED when domain is empty string', async () => {
      try {
        await triage('Build a SaaS marketplace', validBrainId, '');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
      }
    });

    it('returns correct TriageResult for a specification input', async () => {
      const mockResult = {
        intent_type: 'specification',
        scope: 'project',
        domain: 'software',
        specificity: 'general',
        address_key: 'specification.project.software.general',
        classification_confidence: 0.87,
        classification_rationale: 'test',
        active_roles: ['listener', 'architect'],
        urgency: 'standard',
        prior_baseline_detected: false,
      };
      mockFetch.mockResolvedValue(makeOpenRouterResponse(mockResult));
      const result = await triage('Build a SaaS marketplace', validBrainId, 'software');
      expect(result.intent_type).toBe('specification');
      expect(result.address_key).toBe('specification.project.software.general');
      expect(result.classification_confidence).toBe(0.87);
    });

    it('throws VALIDATION_FAILED when API returns invalid intent_type', async () => {
      const mockResult = {
        intent_type: 'invalid_type',
        scope: 'project',
        domain: 'software',
        specificity: 'general',
        address_key: 'invalid_type.project.software.general',
        classification_confidence: 0.87,
        classification_rationale: 'test',
        active_roles: [],
        urgency: 'standard',
        prior_baseline_detected: false,
      };
      mockFetch.mockResolvedValue(makeOpenRouterResponse(mockResult));
      try {
        await triage('Build a SaaS marketplace', validBrainId, 'software');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
      }
    });
  });
});
