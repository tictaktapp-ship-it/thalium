import { AddressKeySchema } from '../schemas/ring';
import { LibrarianError } from './librarian-write';

const VALID_INTENT_TYPES: Set<string> = new Set([
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
]);

const VALID_SCOPES = new Set(['org', 'project', 'entity', 'global']);

export function parseAddressKey(key: string): { intent_type: string; scope: string; domain: string; specificity: string } {
  const parts = key.split('.');
  if (parts.length !== 4) {
    throw new LibrarianError(`Address key must have exactly 4 parts, got ${parts.length}`, 'INVALID_ADDRESS_KEY');
  }

  const [intent_type, scope, domain, specificity] = parts as [string, string, string, string];
  return { intent_type, scope, domain, specificity };
}

export function buildAddressKey(parts: { intent_type: string; scope: string; domain: string; specificity: string }): string {
  if (!VALID_INTENT_TYPES.has(parts.intent_type)) {
    throw new LibrarianError(`Invalid intent_type: ${parts.intent_type}`, 'INVALID_INTENT_TYPE');
  }

  if (!VALID_SCOPES.has(parts.scope)) {
    throw new LibrarianError(`Invalid scope: ${parts.scope}`, 'INVALID_ADDRESS_KEY');
  }

  if (!parts.domain.trim()) {
    throw new LibrarianError('Domain cannot be empty', 'INVALID_ADDRESS_KEY');
  }

  if (!parts.specificity.trim()) {
    throw new LibrarianError('Specificity cannot be empty', 'INVALID_ADDRESS_KEY');
  }

  return `${parts.intent_type}.${parts.scope}.${parts.domain}.${parts.specificity}`;
}

export function isValidAddressKey(key: unknown): boolean {
  if (typeof key !== 'string') return false;

  try {
    const parsed = parseAddressKey(key);
    return VALID_INTENT_TYPES.has(parsed.intent_type) &&
      VALID_SCOPES.has(parsed.scope) &&
      !!parsed.domain.trim() &&
      !!parsed.specificity.trim();
  } catch {
    return false;
  }
}

export function getIntentType(key: string): string {
  if (!isValidAddressKey(key)) {
    throw new LibrarianError('Invalid address key', 'INVALID_ADDRESS_KEY');
  }

  const parts = key.split('.');
  const intentType = parts[0] ?? '';
  return intentType;
}