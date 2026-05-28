import { AddressKeySchema, InstitutionalRingEntrySchema, InstitutionalRingEntry } from '../schemas/ring';
import { z } from 'zod';

export class LibrarianError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: unknown
  ) {
    super(message);
    this.name = 'LibrarianError';
  }
}

export function validateAddressKey(key: string): void {
  const levels = key.split('.');
  if (levels.length !== 4) {
    throw new LibrarianError(
      `Address key must have exactly 4 levels, got ${levels.length}`,
      'INVALID_ADDRESS_KEY',
      { key }
    );
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
    'intent_clarification'
  ];

  const intentType: string = levels[0] ?? "";
  if (!validIntentTypes.includes(intentType)) {
    throw new LibrarianError(
      `Invalid intent type: ${intentType}`,
      'INVALID_INTENT_TYPE',
      { key, validIntentTypes }
    );
  }
}

export async function librarianWrite(entry: unknown): Promise<InstitutionalRingEntry> {
  // Step 1: Inject defaults before validation
  // Callers provide business fields only; librarianWrite owns id, created_at, superseded_by.
  const entryWithDefaults = {
    id: crypto.randomUUID(),
    superseded_by: null,
    created_at: new Date().toISOString(),
    ...(entry as Record<string, unknown>),
  };

  // Step 2: Validate entry schema
  let validatedEntry: InstitutionalRingEntry;
  try {
    validatedEntry = InstitutionalRingEntrySchema.parse(entryWithDefaults);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new LibrarianError(
        'Entry validation failed',
        'VALIDATION_FAILED',
        { issues: err.issues }
      );
    }
    throw err;
  }

  // Step 2: Validate address key format
  try {
    validateAddressKey(validatedEntry.address_key);
  } catch (err) {
    if (err instanceof LibrarianError) {
      throw err;
    }
    throw new LibrarianError(
      'Unexpected error during address key validation',
      'INVALID_ADDRESS_KEY',
      { error: err }
    );
  }

  // Step 3: Write to institutional_ring
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new LibrarianError(
      'Missing Supabase configuration',
      'WRITE_FAILED',
      { missing: !supabaseUrl ? 'SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY' }
    );
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/institutional_ring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(validatedEntry)
    });
  } catch (err) {
    throw new LibrarianError(
      'Failed to write to institutional_ring',
      'WRITE_FAILED',
      { error: err }
    );
  }

  if (!response.ok) {
    throw new LibrarianError(
      `Supabase write failed with status ${response.status}`,
      'WRITE_FAILED',
      { status: response.status, responseText: await response.text() }
    );
  }

  // Step 4: Attempt Coverage Map update via direct upsert (log warning on failure)
  try {
    const coveragePayload = {
      brain_id: validatedEntry.brain_id,
      address_key: validatedEntry.address_key,
      entry_count: 1,
      avg_confidence: validatedEntry.confidence ?? null,
      last_written_at: new Date().toISOString()
    };
    const coverageResponse = await fetch(
      `${supabaseUrl}/rest/v1/coverage_map`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(coveragePayload)
      }
    );
    if (!coverageResponse.ok) {
      console.warn(`[librarian] Coverage Map upsert failed with status ${coverageResponse.status}`);
    }
  } catch (err) {
    console.warn('[librarian] Coverage Map update error:', err);
  }

  return validatedEntry;
}

