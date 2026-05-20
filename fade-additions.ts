SECTION 1: New constants to add after existing constants

export const FADE_WINDOW_DAYS: Record<string, number> = {
  short: 90,
  medium: 180,
  long: 540,
  permanent: Infinity,
};
export const OUTCOME_MODIFIER_HIGH = 1.20;
export const OUTCOME_MODIFIER_LOW = 0.70;
export const OUTCOME_MODIFIER_NEUTRAL = 1.00;
export const EFFECTIVE_ENTRY_THRESHOLD = 0.1;

SECTION 2: New exported functions to add before deriveWeights

export function computeFadeWeight(
  createdAt: string,
  fadeWindowDays: number,
  memoryStyle: string
): number {
  if (fadeWindowDays === Infinity) return 1.0;
  
  const age = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const ratio = age / fadeWindowDays;

  if (memoryStyle === 'precise') {
    return Math.max(0, Math.min(1, Math.exp(-3.0 * ratio)));
  }
  if (memoryStyle === 'expansive') {
    return age < fadeWindowDays ? 1.0 : 0.15;
  }
  return Math.max(0, 1 - ratio);
}

export function applyFadeToEntries(
  entries: RingLeafEntry[],
  memoryLength: string,
  memoryStyle: string,
  outcomeCorrByKey?: Record<string, number>
): Array<RingLeafEntry & { fade_weight: number }> {
  const fadeWindowDays = FADE_WINDOW_DAYS[memoryLength] ?? FADE_WINDOW_DAYS['medium'];
  
  const fadedEntries = entries.map(entry => {
    const base_weight = computeFadeWeight(entry.created_at, fadeWindowDays, memoryStyle);
    const outcome_corr = outcomeCorrByKey?.[entry.address_key];
    
    let modifier = OUTCOME_MODIFIER_NEUTRAL;
    if (outcome_corr !== undefined) {
      if (outcome_corr > 0.7) modifier = OUTCOME_MODIFIER_HIGH;
      else if (outcome_corr < 0.3) modifier = OUTCOME_MODIFIER_LOW;
    }
    
    const fade_weight = Math.min(1.0, base_weight * modifier);
    return { ...entry, fade_weight };
  });

  return fadedEntries.filter(e => e.fade_weight > EFFECTIVE_ENTRY_THRESHOLD);
}

export function countEffectiveEntries(
  entries: RingLeafEntry[],
  memoryLength: string,
  memoryStyle: string
): number {
  return applyFadeToEntries(entries, memoryLength, memoryStyle).length;
}

SECTION 3: Modified deriveWeights function (complete replacement)

export function deriveWeights(entries: RingLeafEntry[], fadeWeights?: number[]): RuleWeights {
  if (entries.length === 0) return { avgConfidence: 0, minConfidence: 0, maxConfidence: 0 };

  let avgConfidence: number;
  if (fadeWeights) {
    const weightedSum = entries.reduce((sum, e, i) => sum + e.confidence * (fadeWeights[i] ?? 1), 0);
    const totalWeight = fadeWeights.reduce((sum, w) => sum + w, 0) || 1;
    avgConfidence = weightedSum / totalWeight;
  } else {
    avgConfidence = entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length;
  }

  const confidences = entries.map(e => e.confidence);
  return {
    avgConfidence,
    minConfidence: Math.min(...confidences),
    maxConfidence: Math.max(...confidences)
  };
}