import { describe, it, expect } from 'vitest';
import { InstitutionalRingEntrySchema, CoverageMapEntrySchema } from './ring';

const validEntry = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  brain_id: '550e8400-e29b-41d4-a716-446655440001',
  address_key: 'specification.org.software.general',
  content: { test: 'value' },
  source: 'chain' as const,
  entry_level: 'leaf' as const,
  confidence: 0.75,
  superseded_by: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

const validCoverageEntry = {
  brain_id: '550e8400-e29b-41d4-a716-446655440001',
  address_key: 'specification.org.software.general',
  entry_count: 5,
  avg_confidence: 0.80,
  last_written_at: '2026-01-01T00:00:00.000Z',
};

describe('InstitutionalRingEntrySchema', () => {
  it('should pass for a valid institutional ring entry', () => {
    expect(InstitutionalRingEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it('should pass for a leaf entry with null superseded_by', () => {
    const leafEntry = { ...validEntry, entry_level: 'leaf' as const, superseded_by: null };
    expect(InstitutionalRingEntrySchema.safeParse(leafEntry).success).toBe(true);
  });

  it('should fail for a leaf entry with non-null superseded_by', () => {
    const invalidLeaf = { ...validEntry, entry_level: 'leaf' as const, superseded_by: '550e8400-e29b-41d4-a716-446655440002' };
    const result = InstitutionalRingEntrySchema.safeParse(invalidLeaf);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Leaf entries cannot have a non-null superseded_by value.');
  });

  it('should pass for a non-leaf entry with non-null superseded_by', () => {
    const supersededBranchEntry = { ...validEntry, entry_level: 'branch' as const, superseded_by: '550e8400-e29b-41d4-a716-446655440002' };
    expect(InstitutionalRingEntrySchema.safeParse(supersededBranchEntry).success).toBe(true);
  });

  it('should fail for confidence out of range (greater than 1)', () => {
    const invalidConf = { ...validEntry, confidence: 1.5 };
    const result = InstitutionalRingEntrySchema.safeParse(invalidConf);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('Number must be less than or equal to 1');
  });

  it('should fail for missing required fields', () => {
    const result = InstitutionalRingEntrySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('CoverageMapEntrySchema', () => {
  it('should pass for a valid coverage map entry', () => {
    expect(CoverageMapEntrySchema.safeParse(validCoverageEntry).success).toBe(true);
  });

  it('should fail for avg_confidence out of range (greater than 1)', () => {
    const invalidConf = { ...validCoverageEntry, avg_confidence: 1.5 };
    const result = CoverageMapEntrySchema.safeParse(invalidConf);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('Number must be less than or equal to 1');
  });
});
