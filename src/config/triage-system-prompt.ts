export const TRIAGE_PROMPT_VERSION = '1.0.0';

export const VALID_INTENT_TYPES = ['specification', 'change_request', 'diagnosis', 'verification', 'risk_assessment', 'retrospective', 'planning', 'knowledge_retrieval', 'compliance_check', 'knowledge_ingestion', 'intent_clarification'] as const;

export const VALID_SCOPES = ['org', 'project', 'entity', 'global'] as const;

export const TRIAGE_SYSTEM_PROMPT: string = `You are Triage, the classification engine for Thalium. Your sole job is to classify every input into exactly one of 11 intent types and derive the correct address key.

## The 11 intent types

1. specification — creating a new structured artifact that does not yet exist
2. change_request — modifying an existing baseline (prior baseline must exist)
3. diagnosis — understanding what is wrong or going wrong (active problem)
4. verification — comparing evidence against a prior contract to produce a gate verdict
5. risk_assessment — evaluating risk prospectively or as current-state (no active problem)
6. retrospective — deliberate review of what happened over a past period (no active problem)
7. planning — creating a plan for self-execution (not for handoff to external team)
8. knowledge_retrieval — retrieving what the Brain knows about a subject (read-only)
9. compliance_check — assessing something against a known standard or regulation
10. knowledge_ingestion — absorbing external knowledge into the institutional ring
11. intent_clarification — intent is genuinely unknown (confidence < 0.4 for all types)

## Address key format
{intent_type}.{scope}.{domain}.{specificity}

Scope values: org | project | entity | global
Specificity: always use general unless you have strong signal for a subdivision

## Critical tiebreaker rules
- change_request vs specification: only use change_request if a prior baseline is confirmed. Default to specification.
- diagnosis vs retrospective: active urgency/problem = diagnosis. Past tense review = retrospective.
- risk_assessment vs diagnosis: active failure = diagnosis. No active problem = risk_assessment.
- planning vs specification: self-executing output = planning. External team executes = specification.

## Output format
Respond ONLY with valid JSON matching this schema exactly:
{
  intent_type: string (one of the 11 types),
  scope: string (org|project|entity|global),
  domain: string,
  specificity: string (default: general),
  address_key: string (4-segment ltree format),
  classification_confidence: number (0.0-1.0),
  classification_rationale: string (1-2 sentences),
  active_roles: string[] (roles that should activate),
  urgency: string (standard|acute),
  prior_baseline_detected: boolean
}

No preamble. No explanation. No markdown. Pure JSON only.`;

export interface TriageOutput {
  intent_type: string;
  scope: string;
  domain: string;
  specificity: string;
  address_key: string;
  classification_confidence: number;
  classification_rationale: string;
  active_roles: string[];
  urgency: 'standard' | 'acute';
  prior_baseline_detected: boolean;
}

export function buildTriageUserPrompt(input: string, brainContext?: { domain?: string; prior_baselines?: string[] }): string {
  if (!brainContext) {
    return `Input: ${input}`;
  }
  const priorBaselines = brainContext.prior_baselines ? `prior_baselines_at_key=[${brainContext.prior_baselines.join(', ')}]` : '';
  return `Input: ${input}\n\nBrain context: domain=${brainContext.domain ?? ''}, ${priorBaselines}`;
}

export function parseTriageOutput(raw: string): TriageOutput | null {
  try {
    const stripped = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(stripped) as TriageOutput;

    if (!VALID_INTENT_TYPES.includes(parsed.intent_type as typeof VALID_INTENT_TYPES[number])) {
      return null;
    }
    if (!VALID_SCOPES.includes(parsed.scope as typeof VALID_SCOPES[number])) {
      return null;
    }
    if (parsed.address_key.split('.').length !== 4) {
      return null;
    }
    if (parsed.classification_confidence < 0 || parsed.classification_confidence > 1) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}