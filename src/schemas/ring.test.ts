import { describe, it, expect } from 'vitest';
import {
  AddressKeySchema,
  InstitutionalRingEntrySchema,
  CoverageMapEntrySchema,
} from './ring';

describe('Schemas', () => {
  // --- AddressKeySchema Tests ---
  describe('AddressKeySchema', () => {
    it('should pass for a valid address key', () => {
      const validKey = 'specification.org.example_domain.specific_item';
      expect(AddressKeySchema.safeParse(validKey).success).toBe(true);
    });

    it('should fail for an address key with fewer than 4 levels', () => {
      const invalidKey = 'specification.org.domain';
      const result = AddressKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Address key must have exactly 4 dot-separated levels.');
    });

    it('should fail for an address key with more than 4 levels', () => {
      const invalidKey = 'specification.org.domain.specificity.extra';
      const result = AddressKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Address key must have exactly 4 dot-separated levels.');
    });

    it('should fail for an invalid intent type (level 1)', () => {
      const invalidKey = 'invalid_intent.org.domain.specificity';
      const result = AddressKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Invalid intent type');
    });

    it('should fail for an invalid scope (level 2)', () => {
      const invalidKey = 'specification.invalid_scope.domain.specificity';
      const result = AddressKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Invalid scope');
    });

    it('should fail for an empty domain (level 3)', () => {
      const invalidKey = 'specification.org..specificity';
      const result = AddressKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Domain (level 3) cannot be an empty string.');
    });

    it('should fail for an empty specificity (level 4)', () => {
      const invalidKey = 'specification.org.domain.';
      const result = AddressKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Specificity (level 4) cannot be an empty string.');
    });
  });

  // --- InstitutionalRingEntrySchema Tests ---
  describe('InstitutionalRingEntrySchema', () => {
    const baseEntry = {
      id: '12345678-1234-1234-1234-123456789012',
      brain_id: '87654321-4321-4321-4321-210987654321',
      address_key: 'specification.org.test_domain.test_specificity',
      content: { some: 'data' },
      source: 'direct_write',
      entry_level: 'branch',
      confidence: 75,
      superseded_by: null,
      created_at: new Date().toISOString(),
    };

    it('should pass for a valid institutional ring entry', () => {
      expect(InstitutionalRingEntrySchema.safeParse(baseEntry).success).toBe(true);
    });

    it('should pass for a leaf entry with null superseded_by', () => {
      const leafEntry = { ...baseEntry, entry_level: 'leaf', superseded_by: null };
      expect(InstitutionalRingEntrySchema.safeParse(leafEntry).success).toBe(true);
    });

    it('should fail for a leaf entry with non-null superseded_by', () => {
      const invalidLeafEntry = { ...baseEntry, entry_level: 'leaf', superseded_by: '00000000-0000-0000-0000-000000000001' };
      const result = InstitutionalRingEntrySchema.safeParse(invalidLeafEntry);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Leaf entries cannot have a non-null superseded_by value.');
    });

    it('should pass for a non-leaf entry with non-null superseded_by', () => {
      const supersededBranchEntry = { ...baseEntry, entry_level: 'branch', superseded_by: '00000000-0000-0000-0000-000000000001' };
      expect(InstitutionalRingEntrySchema.safeParse(supersededBranchEntry).success).toBe(true);
    });

    it('should fail for invalid source enum', () => {
      const invalidSourceEntry = { ...baseEntry, source: 'invalid' as any };
      const result = InstitutionalRingEntrySchema.safeParse(invalidSourceEntry);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Invalid enum value');
    });

    it('should fail for invalid entry_level enum', () => {
      const invalidLevelEntry = { ...baseEntry, entry_level: 'invalid' as any };
      const result = InstitutionalRingEntrySchema.safeParse(invalidLevelEntry);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Invalid enum value');
    });

    it('should fail for confidence out of range (less than 0)', () => {
      const invalidConfidence = { ...baseEntry, confidence: -1 };
      const result = InstitutionalRingEntrySchema.safeParse(invalidConfidence);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Number must be greater than or equal to 0');
    });

    it('should fail for confidence out of range (greater than 100)', () => {
      const invalidConfidence = { ...baseEntry, confidence: 101 };
      const result = InstitutionalRingEntrySchema.safeParse(invalidConfidence);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Number must be less than or equal to 100');
    });
  });

  // --- CoverageMapEntrySchema Tests ---
  describe('CoverageMapEntrySchema', () => {
    const baseCoverageEntry = {
      brain_id: '12345678-aaaa-bbbb-cccc-123456789012',
      address_key: 'knowledge_retrieval.global.some_topic.sub_topic',
      entry_count: 10,
      avg_confidence: 85.5,
      last_written_at: new Date().toISOString(),
    };

    it('should pass for a valid coverage map entry', () => {
      expect(CoverageMapEntrySchema.safeParse(baseCoverageEntry).success).toBe(true);
    });

    it('should fail for a non-positive entry_count', () => {
      const invalidCountEntry = { ...baseCoverageEntry, entry_count: 0 };
      const result = CoverageMapEntrySchema.safeParse(invalidCountEntry);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Number must be greater than 0');
    });

    it('should fail for avg_confidence out of range (less than 0)', () => {
      const invalidConfidence = { ...baseCoverageEntry, avg_confidence: -0.1 };
      const result = CoverageMapEntrySchema.safeParse(invalidConfidence);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Number must be greater than or equal to 0');
    });

    it('should fail for avg_confidence out of range (greater than 100)', () => {
      const invalidConfidence = { ...baseCoverageEntry, avg_confidence: 100.1 };
      const result = CoverageMapEntrySchema.safeParse(invalidConfidence);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Number must be less than or equal to 100');
    });

    it('should fail for invalid brain_id UUID', () => {
      const invalidUuidEntry = { ...baseCoverageEntry, brain_id: 'not-a-uuid' };
      const result = CoverageMapEntrySchema.safeParse(invalidUuidEntry);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Invalid uuid');
    });

    it('should fail for invalid address_key', () => {
      const invalidAddressKeyEntry = { ...baseCoverageEntry, address_key: 'invalid.key' };
      const result = CoverageMapEntrySchema.safeParse(invalidAddressKeyEntry);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('Address key must have exactly 4 dot-separated levels.');
    });
  });
});
