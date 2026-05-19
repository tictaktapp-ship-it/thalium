import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockReadAnchor, mockWriteContribution } = vi.hoisted(() => ({
  mockReadAnchor: vi.fn(),
  mockWriteContribution: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  readAnchor: mockReadAnchor,
  writeContribution: mockWriteContribution,
}));

import { validate, DEFAULT_CONFIDENCE_THRESHOLD, MAX_RECLASSIFICATION_ATTEMPTS } from '../../roles/validator';
import { LibrarianError } from '../../lib/librarian-write';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';

const makeAnchor = (scorerPayload: object, validatorCount = 0) => ({
  session_id: sessionId,
  brain_id: '87654321-4321-4321-4321-210987654321',
  address_key: 'specification.project.software.general',
  created_at: new Date().toISOString(),
  last_refreshed_at: new Date().toISOString(),
  paused_at: null,
  pause_timeout_minutes: 10,
  contributions: [
    {
      role: 'scorer',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: scorerPayload
    },
    ...Array(validatorCount).fill({
      role: 'validator',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: {}
    })
  ]
});

describe('validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteContribution.mockResolvedValue({ contributions: [] });
  });

  it('returns approved when confidence is above threshold and gate passes', async () => {
    mockReadAnchor.mockResolvedValue(makeAnchor({ confidence_score: 80, gate_decision: 'pass' }));
    const result = await validate(sessionId, 'specification');
    expect(result.output.verdict).toBe('approved');
    expect(result.output.confidence_score).toBe(80);
    expect(result.anchor_contribution.role).toBe('validator');
  });

  it('returns reclassify when gate fails and reclassification count is below max', async () => {
    mockReadAnchor.mockResolvedValue(makeAnchor({ confidence_score: 40, gate_decision: 'fail' }, 0));
    const result = await validate(sessionId, 'specification');
    expect(result.output.verdict).toBe('reclassify');
    expect(result.output.reclassification_count).toBe(0);
  });

  it('returns novel_signal when gate fails and reclassification count is at max', async () => {
    mockReadAnchor.mockResolvedValue(makeAnchor({ confidence_score: 40, gate_decision: 'fail' }, MAX_RECLASSIFICATION_ATTEMPTS));
    const result = await validate(sessionId, 'specification');
    expect(result.output.verdict).toBe('novel_signal');
  });

  it('returns rejected when confidence is below threshold', async () => {
    mockReadAnchor.mockResolvedValue(makeAnchor({ confidence_score: 30, gate_decision: 'pass_with_warning' }));
    const result = await validate(sessionId, 'specification');
    expect(result.output.verdict).toBe('rejected');
  });

  it('throws VALIDATION_FAILED when scorer contribution is missing', async () => {
    mockReadAnchor.mockResolvedValue({
      session_id: sessionId,
      brain_id: '87654321-4321-4321-4321-210987654321',
      address_key: 'specification.project.software.general',
      created_at: new Date().toISOString(),
      last_refreshed_at: new Date().toISOString(),
      paused_at: null,
      pause_timeout_minutes: 10,
      contributions: []
    });
    try {
      await validate(sessionId, 'specification');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });
});
