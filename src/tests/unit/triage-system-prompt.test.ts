import { describe, it, expect } from 'vitest';
import {
  TRIAGE_PROMPT_VERSION,
  TRIAGE_SYSTEM_PROMPT,
  VALID_INTENT_TYPES,
  VALID_SCOPES,
  buildTriageUserPrompt,
  parseTriageOutput,
} from '../../config/triage-system-prompt';

describe('triage-system-prompt', () => {
  it('TRIAGE_PROMPT_VERSION is semver string', () => {
    expect(TRIAGE_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('TRIAGE_SYSTEM_PROMPT contains all 11 intent types', () => {
    for (const type of VALID_INTENT_TYPES) {
      expect(TRIAGE_SYSTEM_PROMPT).toContain(type);
    }
  });

  it('TRIAGE_SYSTEM_PROMPT contains address key format instruction', () => {
    expect(TRIAGE_SYSTEM_PROMPT).toContain('address_key');
  });

  it('VALID_INTENT_TYPES has exactly 11 types', () => {
    expect(VALID_INTENT_TYPES).toHaveLength(11);
  });

  it('VALID_SCOPES has exactly 4 values', () => {
    expect(VALID_SCOPES).toHaveLength(4);
    expect(VALID_SCOPES).toContain('org');
    expect(VALID_SCOPES).toContain('project');
    expect(VALID_SCOPES).toContain('entity');
    expect(VALID_SCOPES).toContain('global');
  });

  describe('buildTriageUserPrompt', () => {
    it('returns input-only prompt when no context', () => {
      const prompt = buildTriageUserPrompt('Build a marketplace');
      expect(prompt).toContain('Build a marketplace');
    });

    it('includes domain in prompt when provided', () => {
      const prompt = buildTriageUserPrompt('Build a marketplace', { domain: 'software' });
      expect(prompt).toContain('software');
    });

    it('includes prior baselines when provided', () => {
      const prompt = buildTriageUserPrompt('Add a feature', {
        domain: 'software',
        prior_baselines: ['specification.project.software.general'],
      });
      expect(prompt).toContain('specification.project.software.general');
    });
  });

  describe('parseTriageOutput', () => {
    it('parses valid JSON response', () => {
      const raw = JSON.stringify({
        intent_type: 'specification',
        scope: 'project',
        domain: 'software',
        specificity: 'general',
        address_key: 'specification.project.software.general',
        classification_confidence: 0.87,
        classification_rationale: 'New artifact, no prior baseline.',
        active_roles: ['listener', 'architect', 'devil', 'scorer'],
        urgency: 'standard',
        prior_baseline_detected: false,
      });

      const result = parseTriageOutput(raw);
      expect(result).not.toBeNull();
      expect(result?.intent_type).toBe('specification');
      expect(result?.classification_confidence).toBe(0.87);
    });

    it('strips markdown fences before parsing', () => {
      const raw = '```json\n{"intent_type":"diagnosis","scope":"entity","domain":"software","specificity":"general","address_key":"diagnosis.entity.software.general","classification_confidence":0.9,"classification_rationale":"Active error.","active_roles":["listener"],"urgency":"acute","prior_baseline_detected":false}\n```';
      const result = parseTriageOutput(raw);
      expect(result).not.toBeNull();
      expect(result?.intent_type).toBe('diagnosis');
    });

    it('returns null for invalid intent type', () => {
      const raw = JSON.stringify({
        intent_type: 'invalid_type',
        scope: 'project',
        domain: 'software',
        specificity: 'general',
        address_key: 'invalid_type.project.software.general',
        classification_confidence: 0.8,
        classification_rationale: 'test',
        active_roles: [],
        urgency: 'standard',
        prior_baseline_detected: false,
      });
      expect(parseTriageOutput(raw)).toBeNull();
    });

    it('returns null for address_key with wrong segment count', () => {
      const raw = JSON.stringify({
        intent_type: 'specification',
        scope: 'project',
        domain: 'software',
        specificity: 'general',
        address_key: 'specification.project.software',
        classification_confidence: 0.8,
        classification_rationale: 'test',
        active_roles: [],
        urgency: 'standard',
        prior_baseline_detected: false,
      });
      expect(parseTriageOutput(raw)).toBeNull();
    });

    it('returns null for unparseable JSON', () => {
      expect(parseTriageOutput('not json at all')).toBeNull();
    });
  });
});
