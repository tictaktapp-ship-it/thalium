import { describe, it, expect } from 'vitest';
import { parseAddressKey, buildAddressKey, isValidAddressKey, getIntentType } from '../../lib/address-key';
import { LibrarianError } from '../../lib/librarian-write';

describe('address-key', () => {
  describe('parseAddressKey', () => {
    it('returns correct parts for valid address key', () => {
      const result = parseAddressKey('specification.org.software.general');
      expect(result).toEqual({
        intent_type: 'specification',
        scope: 'org',
        domain: 'software',
        specificity: 'general'
      });
    });

    it('throws LibrarianError with code INVALID_ADDRESS_KEY on invalid format', () => {
      try {
        parseAddressKey('specification.org.software');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('INVALID_ADDRESS_KEY');
      }
    });
  });

  describe('buildAddressKey', () => {
    it('constructs valid address key from parts', () => {
      const result = buildAddressKey({ intent_type: 'specification', scope: 'org', domain: 'software', specificity: 'general' });
      expect(result).toBe('specification.org.software.general');
    });

    it('throws LibrarianError with code INVALID_ADDRESS_KEY on invalid intent_type', () => {
      try {
        buildAddressKey({ intent_type: 'invalid', scope: 'org', domain: 'software', specificity: 'general' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('INVALID_INTENT_TYPE');
      }
    });

    it('throws LibrarianError with code INVALID_ADDRESS_KEY on invalid scope', () => {
      try {
        buildAddressKey({ intent_type: 'specification', scope: 'universe', domain: 'software', specificity: 'general' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('INVALID_ADDRESS_KEY');
      }
    });

    it('throws LibrarianError with code INVALID_ADDRESS_KEY on empty domain', () => {
      try {
        buildAddressKey({ intent_type: 'specification', scope: 'org', domain: '', specificity: 'general' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('INVALID_ADDRESS_KEY');
      }
    });
  });

  describe('isValidAddressKey', () => {
    it('returns true for valid address key', () => {
      expect(isValidAddressKey('specification.org.software.general')).toBe(true);
    });

    it('returns false for invalid address key without throwing', () => {
      expect(isValidAddressKey('bad.key')).toBe(false);
    });
  });

  describe('getIntentType', () => {
    it('returns intent_type from valid address key', () => {
      expect(getIntentType('specification.org.software.general')).toBe('specification');
    });
  });
});
