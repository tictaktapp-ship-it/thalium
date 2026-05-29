import { describe, expect, it, vi } from 'vitest';
import { LibrarianError } from '../lib/librarian-write';
import { librarianWrite } from '../lib/librarian-write';
import { type InstitutionalRingWrite } from '../schemas/ring';

vi.mock('../lib/supabase-client', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  },
}));

describe('librarianWrite', () => {
  it('throws LibrarianError with code VALIDATION_FAILED when input is invalid', async () => {
    const invalidInput = {
      address_key: 'specification.org.domain.specificity',
      confidence: 0.75,
      content: 'test content',
    } as InstitutionalRingWrite;

    await expect(librarianWrite(invalidInput)).rejects.toThrow(
      new LibrarianError('VALIDATION_FAILED', 'Invalid input'),
    );
  });

  it('throws LibrarianError with code WRITE_FAILED when Supabase fetch fails', async () => {
    const validInput = {
      address_key: 'specification.org.domain.specificity',
      confidence: 0.75,
      content: 'test content',
    } as InstitutionalRingWrite;

    vi.spyOn(
      await import('../lib/supabase-client'),
      'supabaseClient',
    ).mockImplementationOnce(() => {
      throw new Error('Supabase fetch failed');
    });

    await expect(librarianWrite(validInput)).rejects.toThrow(
      new LibrarianError('WRITE_FAILED', 'Supabase fetch failed'),
    );
  });

  it('returns success when write is successful', async () => {
    const validInput = {
      address_key: 'specification.org.domain.specificity',
      confidence: 0.85,
      content: 'test content',
    } as InstitutionalRingWrite;

    vi.spyOn(
      await import('../lib/supabase-client'),
      'supabaseClient',
    ).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue({ data: validInput }),
    }));

    await expect(librarianWrite(validInput)).resolves.toEqual({
      success: true,
      data: validInput,
    });
  });

  it('throws LibrarianError with code WRITE_FAILED when Supabase returns error', async () => {
    const validInput = {
      address_key: 'specification.org.domain.specificity',
      confidence: 0.95,
      content: 'test content',
    } as InstitutionalRingWrite;

    vi.spyOn(
      await import('../lib/supabase-client'),
      'supabaseClient',
    ).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue({ error: new Error('Supabase error') }),
    }));

    await expect(librarianWrite(validInput)).rejects.toThrow(
      new LibrarianError('WRITE_FAILED', 'Supabase error'),
    );
  });

  it('throws LibrarianError with code WRITE_FAILED when Supabase returns no data', async () => {
    const validInput = {
      address_key: 'specification.org.domain.specificity',
      confidence: 0.65,
      content: 'test content',
    } as InstitutionalRingWrite;

    vi.spyOn(
      await import('../lib/supabase-client'),
      'supabaseClient',
    ).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue({ data: null }),
    }));

    await expect(librarianWrite(validInput)).rejects.toThrow(
      new LibrarianError('WRITE_FAILED', 'No data returned from Supabase'),
    );
  });
});