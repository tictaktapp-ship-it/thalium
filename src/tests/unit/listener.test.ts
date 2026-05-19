import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listen, ListenerResult, IntentObject } from '../../roles/listener';
import { LibrarianError } from '../../lib/librarian-write';

const mockWriteContribution = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('../../lib/anchor', () => ({
  writeContribution: mockWriteContribution
}));

vi.stubGlobal('fetch', mockFetch);

describe('listener', () => {
  const validSessionId = '123e4567-e89b-12d3-a456-426614174000';
  const validBrainId = '987e6543-e21b-43d3-a456-426614174999';
  const validAddressKey = 'diagnosis.project.medical.high';
  const validInput = 'Patient presents with fever and headache';

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
    mockWriteContribution.mockResolvedValue({ contributions: [] });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  it('throws VALIDATION_FAILED when input is empty string', async () => {
    try {
      await listen(validSessionId, '', validAddressKey, validBrainId);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LibrarianError);
      expect((error as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('throws VALIDATION_FAILED when addressKey is empty string', async () => {
    try {
      await listen(validSessionId, validInput, '', validBrainId);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LibrarianError);
      expect((error as LibrarianError).code).toBe('VALIDATION_FAILED');
    }
  });

  it('returns high prediction_error_score when no ring entries found', async () => {
    const result = await listen(validSessionId, validInput, validAddressKey, validBrainId);

    expect(result.intent_object.prediction_error_score).toBe(0.9);
    expect(result.intent_object.institutional_ring_entries_found).toBe(0);
  });

  it('returns low prediction_error_score when many ring entries found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => Array(25).fill({ id: 'test' }),
    });

    const result = await listen(validSessionId, validInput, validAddressKey, validBrainId);

    expect(result.intent_object.prediction_error_score).toBe(0.1);
  });

  it('writes contribution to anchor with role listener', async () => {
    await listen(validSessionId, validInput, validAddressKey, validBrainId);

    expect(mockWriteContribution).toHaveBeenCalledWith(
      validSessionId,
      expect.objectContaining({
        role: 'listener',
        status: 'complete',
      })
    );
  });

  it('extracts detected_signals from input', async () => {
    const longInput = 'This input contains severallongwords like hypercalcemia and lymphadenopathy';
    const result = await listen(validSessionId, longInput, validAddressKey, validBrainId);

    expect(result.intent_object.detected_signals).toBeInstanceOf(Array);
    expect(result.intent_object.detected_signals.length).toBeGreaterThan(0);
  });
});