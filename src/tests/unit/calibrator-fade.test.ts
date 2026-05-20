import { describe, it, expect } from 'vitest';
import {
  computeFadeWeight,
  applyFadeToEntries,
  countEffectiveEntries,
  deriveWeights,
  FADE_WINDOW_DAYS,
  EFFECTIVE_ENTRY_THRESHOLD,
} from '../../jobs/calibrator';
import type { RingLeafEntry } from '../../jobs/calibrator';

function makeEntry(id: string, confidence: number, daysAgo: number): RingLeafEntry {
  const created_at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return { id, address_key: 'specification.project.software.general', content: {}, confidence, created_at };
}

describe('calibrator — memory fade', () => {
  describe('computeFadeWeight', () => {
    it('returns 1.0 for permanent memory length', () => {
      expect(computeFadeWeight(new Date().toISOString(), Infinity, 'balanced')).toBe(1.0);
    });

    it('returns 1.0 for entry at age 0 (balanced)', () => {
      const weight = computeFadeWeight(new Date().toISOString(), 180, 'balanced');
      expect(weight).toBeCloseTo(1.0, 1);
    });

    it('returns 0 for entry at fade window boundary (balanced)', () => {
      const createdAt = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      const weight = computeFadeWeight(createdAt, 180, 'balanced');
      expect(weight).toBeCloseTo(0, 1);
    });

    it('returns ~0.05 at fade window boundary for precise (exponential)', () => {
      const createdAt = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      const weight = computeFadeWeight(createdAt, 180, 'precise');
      expect(weight).toBeCloseTo(Math.exp(-3.0), 2);
    });

    it('returns 1.0 within window for expansive (anchored)', () => {
      const createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const weight = computeFadeWeight(createdAt, 180, 'expansive');
      expect(weight).toBe(1.0);
    });

    it('returns 0.15 beyond window for expansive (anchored)', () => {
      const createdAt = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
      const weight = computeFadeWeight(createdAt, 180, 'expansive');
      expect(weight).toBe(0.15);
    });
  });

  describe('applyFadeToEntries', () => {
    it('filters out entries below effective threshold', () => {
      const recent = makeEntry('e1', 80, 10);
      const old = makeEntry('e2', 80, 400); // way beyond 180-day window
      const result = applyFadeToEntries([recent, old], 'medium', 'balanced');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('e1');
    });

    it('attaches fade_weight to each entry', () => {
      const entry = makeEntry('e1', 80, 10);
      const result = applyFadeToEntries([entry], 'medium', 'balanced');
      expect(result[0]).toHaveProperty('fade_weight');
      expect(result[0].fade_weight).toBeGreaterThan(EFFECTIVE_ENTRY_THRESHOLD);
    });

    it('applies outcome modifier boost for high correlation', () => {
      const entry = makeEntry('e1', 80, 10);
      const withBoost = applyFadeToEntries([entry], 'medium', 'balanced', {
        'specification.project.software.general': 0.85,
      });
      const withoutBoost = applyFadeToEntries([entry], 'medium', 'balanced');
      expect(withBoost[0].fade_weight).toBeGreaterThan(withoutBoost[0].fade_weight);
    });

    it('applies outcome modifier reduction for low correlation', () => {
      const entry = makeEntry('e1', 80, 10);
      const withReduction = applyFadeToEntries([entry], 'medium', 'balanced', {
        'specification.project.software.general': 0.2,
      });
      const withoutMod = applyFadeToEntries([entry], 'medium', 'balanced');
      expect(withReduction[0].fade_weight).toBeLessThan(withoutMod[0].fade_weight);
    });
  });

  describe('countEffectiveEntries', () => {
    it('counts only entries above effective threshold', () => {
      const recent = makeEntry('e1', 80, 10);
      const old = makeEntry('e2', 80, 400);
      const count = countEffectiveEntries([recent, old], 'medium', 'balanced');
      expect(count).toBe(1);
    });
  });

  describe('deriveWeights with fadeWeights', () => {
    it('uses weighted average when fadeWeights provided', () => {
      const entries = [
        makeEntry('e1', 90, 10),
        makeEntry('e2', 50, 10),
      ];
      const unweighted = deriveWeights(entries);
      const weighted = deriveWeights(entries, [1.0, 0.1]); // e2 nearly ignored
      // With high fade weight on e1 (confidence 90), architect_weight should be higher
      expect(weighted.architect_weight).toBeGreaterThanOrEqual(unweighted.architect_weight);
    });

    it('falls back to simple average when fadeWeights not provided', () => {
      const entries = [makeEntry('e1', 80, 10), makeEntry('e2', 60, 10)];
      const result = deriveWeights(entries);
      expect(result.architect_weight + result.devil_weight + result.coverage_weight).toBeCloseTo(1.0, 2);
    });
  });
});
