import { describe, it, expect } from 'vitest';
import { TRIAGE_GOLDEN_DATASET, VALIDATION_CRITERIA } from '../../tests/fixtures/triage-golden-dataset';

describe('triage-golden-dataset', () => {
  it('contains exactly 50 items', () => {
    expect(TRIAGE_GOLDEN_DATASET).toHaveLength(50);
  });

  it('all items have required fields', () => {
    for (const item of TRIAGE_GOLDEN_DATASET) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('input');
      expect(item).toHaveProperty('correct_type');
      expect(item).toHaveProperty('correct_scope');
      expect(item).toHaveProperty('correct_domain');
      expect(item).toHaveProperty('address_key');
    }
  });

  it('ids are sequential 1-50', () => {
    const ids = TRIAGE_GOLDEN_DATASET.map(i => i.id);
    expect(ids[0]).toBe(1);
    expect(ids[49]).toBe(50);
    expect(new Set(ids).size).toBe(50);
  });

  it('all correct_types are valid intent types', () => {
    const validTypes = [
      'specification', 'change_request', 'diagnosis', 'verification',
      'risk_assessment', 'retrospective', 'planning', 'knowledge_retrieval',
      'compliance_check', 'knowledge_ingestion', 'intent_clarification'
    ];
    for (const item of TRIAGE_GOLDEN_DATASET) {
      expect(validTypes).toContain(item.correct_type);
    }
  });

  it('all scopes are valid (or empty for intent_clarification)', () => {
    const validScopes = ['org', 'project', 'entity', 'global', ''];
    for (const item of TRIAGE_GOLDEN_DATASET) {
      expect(validScopes).toContain(item.correct_scope);
    }
  });

  it('only item 50 has empty address_key (intent_clarification)', () => {
    const emptyKeyItems = TRIAGE_GOLDEN_DATASET.filter(i => i.address_key === '');
    expect(emptyKeyItems).toHaveLength(1);
    expect(emptyKeyItems[0].id).toBe(50);
    expect(emptyKeyItems[0].correct_type).toBe('intent_clarification');
  });

  it('address_keys follow 4-segment ltree format for non-clarification items', () => {
    const ltreeRegex = /^[a-z_]+\.[a-z_]+\.[a-z_]+\.[a-z_]+$/;
    for (const item of TRIAGE_GOLDEN_DATASET) {
      if (item.correct_type !== 'intent_clarification') {
        expect(item.address_key).toMatch(ltreeRegex);
      }
    }
  });

  it('VALIDATION_CRITERIA has correct thresholds', () => {
    expect(VALIDATION_CRITERIA.min_type_accuracy).toBe(0.96);
    expect(VALIDATION_CRITERIA.min_domain_accuracy).toBe(0.98);
    expect(VALIDATION_CRITERIA.max_intent_clarification_false_positives).toBe(0);
  });
});
