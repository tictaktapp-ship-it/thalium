import { librarianWrite } from './librarian-write';

const INTENT_TYPES = [
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
  'intent_clarification'
] as const;

const SCOPES = ['org', 'project', 'entity'] as const;

export type SeedResult = {
  total: number;
  written: number;
  failed: number;
  errors: string[];
};

function log(level: 'info' | 'error', message: string, context: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, component: 'seeder', message, ...context }));
}

/**
 * Seeds a new Brain Instance with 33 branch-level baseline entries (11 intent types × 3 scopes).
 * All writes go via librarianWrite (P7 compliance). Never throws — logs failures and continues.
 */
export async function seedBrainInstance(brainId: string, domain: string): Promise<SeedResult> {
  const result: SeedResult = {
    total: INTENT_TYPES.length * SCOPES.length,
    written: 0,
    failed: 0,
    errors: []
  };

  log('info', 'Starting seed', { brain_id: brainId, domain, total: result.total });

  const seeded_at = new Date().toISOString();

  for (const intent_type of INTENT_TYPES) {
    for (const scope of SCOPES) {
      const address_key = `${intent_type}.${scope}.${domain}.general`;
      try {
        await librarianWrite({
          brain_id: brainId,
          address_key,
          content: {
            seeded_at,
            domain,
            intent_type,
            scope,
            note: 'Baseline seed entry — Calibrator will refine confidence and subdivide specificity as invocations accumulate.'
          },
          source: 'seeding',
          entry_level: 'branch',
          confidence: 0.50
        });
        result.written++;
      } catch (error) {
        result.failed++;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`${address_key}: ${msg}`);
        log('error', 'Seed entry failed', { brain_id: brainId, address_key, error: msg });
      }
    }
  }

  log('info', 'Seed complete', { brain_id: brainId, domain, written: result.written, failed: result.failed });
  return result;
}