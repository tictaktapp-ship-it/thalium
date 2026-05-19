import { z } from 'zod';
import { LibrarianError } from '../lib/librarian-write';
import { isValidAddressKey } from '../lib/address-key';
import { AddressKeySchema } from '../schemas/ring';
import { AnchorState } from '../schemas/anchor';

export interface TriageResult {
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

const validIntentTypes = [
  'specification',
  'change_request',
  'diagnosis',
  'verification',
  'risk_assessment',
  'retrospective',
  'planning',
  'knowledge_retrieval',
  'compliance_check',
  'knowledge_ingestion',
  'intent_clarification',
] as const;

const validScopes = ['org', 'project', 'entity', 'global'] as const;

const IntentTypeSchema = z.enum(validIntentTypes);
const ScopeSchema = z.enum(validScopes);

const RoleActivationTable: Record<string, string[]> = {
  specification: ['specification_writer', 'domain_expert'],
  change_request: ['change_analyst', 'impact_assessor'],
  diagnosis: ['diagnostician', 'remediation_planner'],
  verification: ['verification_engineer', 'quality_assurance'],
  risk_assessment: ['risk_analyst', 'compliance_officer'],
  retrospective: ['retrospective_analyst', 'process_improver'],
  planning: ['strategist', 'scenario_planner'],
  knowledge_retrieval: ['knowledge_retriever', 'context_builder'],
  compliance_check: ['compliance_checker', 'legal_analyst'],
  knowledge_ingestion: ['knowledge_engineer', 'taxonomy_builder'],
  intent_clarification: ['clarification_engineer', 'dialogue_manager'],
};

export function buildClassificationPrompt(input: string, domain: string): string {
  return `Classify this input against the 11 intent types and return ONLY a JSON object with these exact properties:
- intent_type: one of ${validIntentTypes.join(', ')}
- scope: one of ${validScopes.join(', ')}
- domain: "${domain}"
- specificity: 'general' unless the input clearly indicates a more specific pattern
- classification_confidence: between 0 and 1
- classification_rationale: brief explanation
- active_roles: array based on intent type
- urgency: 'acute' only for diagnosis inputs with production impact language
- prior_baseline_detected: true only for change_request inputs

Input: ${input}

Return ONLY the JSON object with no markdown, no explanation, no other formatting.`;
}

export async function triage(input: string, brainId: string, domain: string): Promise<TriageResult> {
  if (!input || typeof input !== 'string') {
    throw new LibrarianError('Input must be a non-empty string', 'VALIDATION_FAILED');
  }

  if (!domain || typeof domain !== 'string') {
    throw new LibrarianError('Domain must be a non-empty string', 'VALIDATION_FAILED');
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    throw new LibrarianError('OPENROUTER_API_KEY not set', 'CONFIGURATION_ERROR');
  }

  const prompt = buildClassificationPrompt(input, domain);
  let response: TriageResult;

  try {
    const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!apiResponse.ok) {
      throw new LibrarianError(`OpenRouter API failed with status ${apiResponse.status}`, 'API_ERROR');
    }

    const data = await apiResponse.json();
    const messageObj = ((data as Record<string, unknown>)?.choices as Record<string, unknown>[])?.[0]?.message as Record<string, unknown> | undefined;
    const content = messageObj?.content as string | undefined;
    if (!content) {
      throw new LibrarianError('No content in API response', 'API_ERROR');
    }

    response = JSON.parse(content);
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    throw new LibrarianError(`Failed to call classification API: ${error instanceof Error ? error.message : String(error)}`, 'API_ERROR');
  }

  try {
    IntentTypeSchema.parse(response.intent_type);
    ScopeSchema.parse(response.scope);

    if (response.domain !== domain) {
      throw new LibrarianError('Domain mismatch in response', 'VALIDATION_FAILED');
    }

    if (response.classification_confidence < 0 || response.classification_confidence > 1) {
      throw new LibrarianError('Invalid confidence value', 'VALIDATION_FAILED');
    }

    const addressKey = `${response.intent_type}.${response.scope}.${domain}.${response.specificity || 'general'}`;
    if (!isValidAddressKey(addressKey)) { throw new LibrarianError(`Invalid address key: ${addressKey}`, 'VALIDATION_FAILED'); }

    const activeRoles = RoleActivationTable[response.intent_type] || [];

    const result: TriageResult = {
      intent_type: response.intent_type,
      scope: response.scope,
      domain: domain,
      specificity: response.specificity || 'general',
      address_key: addressKey,
      classification_confidence: response.classification_confidence,
      classification_rationale: response.classification_rationale || '',
      active_roles: activeRoles,
      urgency: response.urgency === 'acute' ? 'acute' : 'standard',
      prior_baseline_detected: response.prior_baseline_detected || false,
    };

    return result;
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    throw new LibrarianError(`Response validation failed: ${error instanceof Error ? error.message : String(error)}`, 'VALIDATION_FAILED');
  }
}