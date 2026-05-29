import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LibrarianError, librarianWrite, validateAddressKey } from '../../lib/librarian-write';
import { InstitutionalRingEntry } from '../../schemas/ring';

describe('librarian-write', () => {
  const validEntry: InstitutionalRingEntry = {
    id: '12345678-1234-1234-1234-123456789012',
    brain_id: '87654321-4321-4321-4321-210987654321',
    address_key: 'specification.org.software.general',
    content: { test: true },
    source: 'chain',
    entry_level: 'branch',
    confidence: 0.75,
    superseded_by: null,
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env.SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('validateAddressKey', () => {
    it('throws LibrarianError with code INVALID_ADDRESS_KEY on a 3-level key', () => {
      expect(() => validateAddressKey('specification.org.software')).toThrow(
        expect.objectContaining({ code: 'INVALID_ADDRESS_KEY' })
      );
    });

    it('throws LibrarianError with code INVALID_INTENT_TYPE on invalid intent type', () => {
      expect(() => validateAddressKey('invalid.org.software.general')).toThrow(
        expect.objectContaining({ code: 'INVALID_INTENT_TYPE' })
      );
    });

    it('does not throw on a valid 4-level key', () => {
      expect(() => validateAddressKey('specification.org.software.general')).not.toThrow();
    });
  });

  describe('librarianWrite', () => {
    it('throws LibrarianError with code VALIDATION_FAILED when entry is invalid', () => {
      const invalidEntry = { ...validEntry, address_key: undefined };
      expect(() => librarianWrite(invalidEntry as any)).rejects.toThrow(
        expect.objectContaining({ code: 'VALIDATION_FAILED' })
      );
    });

    it('throws LibrarianError with code VALIDATION_FAILED when address_key has wrong format', () => {
      const invalidEntry = { ...validEntry, address_key: 'specification.org.software' };
      expect(() => librarianWrite(invalidEntry)).rejects.toThrow(
        expect.objectContaining({ code: 'VALIDATION_FAILED' })
      );
    });

    it('throws LibrarianError with code WRITE_FAILED when Supabase fetch fails', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await expect(librarianWrite(validEntry)).rejects.toThrow(
        expect.objectContaining({ code: 'WRITE_FAILED' })
      );
    });

    it('returns the validated entry when fetch succeeds', async () => {
      (fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [validEntry], error: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

      const result = await librarianWrite(validEntry);
      expect(result).toEqual(validEntry);
    });
  });
});