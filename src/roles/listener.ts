import { writeContribution } from '../lib/anchor';
import { AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from '../lib/librarian-write';
import { z } from 'zod';

export interface IntentObject {
  raw_input: string;
  detected_signals: string[];
  prediction_error_score: number;
  context_summary: string;
  institutional_ring_entries_found: number;
}

export interface ListenerResult {
  intent_object: IntentObject;
  anchor_contribution: AnchorContribution;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchInstitutionalRingEntries(addressKey: string, brainId: string): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase credentials not configured');
    return 0;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/institutional_ring?address_key=eq.${addressKey}&brain_id=eq.${brainId}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch institutional ring entries: ${response.statusText}`);
      return 0;
    }

    const data = await response.json();
    return (data as unknown[]).length;
  } catch (error) {
    console.warn('Error fetching institutional ring entries:', error);
    return 0;
  }
}

function computePredictionErrorScore(entriesFound: number): number {
  if (entriesFound === 0) return 0.9;
  if (entriesFound >= 1 && entriesFound <= 5) return 0.6;
  if (entriesFound >= 6 && entriesFound <= 20) return 0.3;
  return 0.1;
}

function extractDetectedSignals(input: string): string[] {
  const words = input.split(' ');
  const signals = words
    .filter(word => word.length > 4)
    .map(word => word.toLowerCase())
    .filter((word, index, self) => self.indexOf(word) === index)
    .slice(0, 10);
  return signals;
}

export async function listen(
  sessionId: string,
  input: string,
  addressKey: string,
  brainId: string
): Promise<ListenerResult> {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new LibrarianError('Input must be a non-empty string', 'VALIDATION_FAILED');
  }

  if (typeof addressKey !== 'string' || addressKey.trim().length === 0) {
    throw new LibrarianError('Address key must be a non-empty string', 'VALIDATION_FAILED');
  }

  const entriesFound = await fetchInstitutionalRingEntries(addressKey, brainId);
  const prediction_error_score = computePredictionErrorScore(entriesFound);
  const detected_signals = extractDetectedSignals(input);

  const intentObject: IntentObject = {
    raw_input: input,
    detected_signals,
    prediction_error_score,
    context_summary: '',
    institutional_ring_entries_found: entriesFound
  };
  const contribution: AnchorContribution = {
    role: 'listener',
    status: 'complete',
    written_at: new Date().toISOString(),
    payload: intentObject
  };
  await writeContribution(sessionId, contribution);
  return {
    intent_object: intentObject,
    anchor_contribution: contribution
  };
}