import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockWriteContribution, mockFetch } = vi.hoisted(() => ({
  mockWriteContribution: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  writeContribution: mockWriteContribution,
}));

vi.stubGlobal('fetch', mockFetch);

import { enforceeBoundaries } from '../../roles/boundary-keeper';
import { LibrarianError } from '../../lib/librarian-write';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const brainId = '87654321-4321-4321-4321-210987654321';
const validArtifact = 'This is a valid artifact with no violations.';
const validDomain = 'software';

describe('boundary-keeper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockWriteContribution.mockResolvedValue({ contributions: [] });
    mockFetch.mockResolvedValue({ ok: true, json: async () => [], text: async () => '' });
  });

  it('throws VALIDATION_FAILED when artifact is empty string', async () => {
    try {
      await enforceeBoundaries(sessionId, '', validDomain, brainId);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('throws VALIDATION_FAILED when domain is empty string', async () => {
    try {
      await enforceeBoundaries(sessionId, validArtifact, '', brainId);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('returns allow action for clean artifact', async () => {
    const result = await enforceeBoundaries(sessionId, validArtifact, validDomain, brainId);
    expect(result.output.action).toBe('allow');
    expect(result.output.passed).toBe(true);
    expect(result.output.violations).toHaveLength(0);
  });

  it('returns block action when artifact contains blocked term', async () => {
    const maliciousArtifact = 'Here is some code: <script>alert("xss")</script>';
    const result = await enforceeBoundaries(sessionId, maliciousArtifact, validDomain, brainId);
    expect(result.output.action).toBe('block');
    expect(result.output.passed).toBe(false);
    expect(result.output.violations.length).toBeGreaterThan(0);
  });

  it('returns warn action when artifact exceeds recommended length', async () => {
    const longArtifact = 'a'.repeat(50001);
    const result = await enforceeBoundaries(sessionId, longArtifact, validDomain, brainId);
    expect(result.output.action).toBe('warn');
    expect(result.output.warnings.length).toBeGreaterThan(0);
  });

  it('writes boundary_keeper contribution to anchor', async () => {
    await enforceeBoundaries(sessionId, validArtifact, validDomain, brainId);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'boundary_keeper', status: 'complete' })
    );
  });
});
