import { shardA, shardB, shardC } from '../lib/redis';
import { LibrarianError } from '../lib/librarian-write';

export interface IntegrityCheckResult {
  check: string;
  passed: boolean;
  failures: string[];
  checked_at: string;
}

export interface RingIntegrityReport {
  brain_id: string;
  passed: boolean;
  checks: IntegrityCheckResult[];
  run_at: string;
  duration_ms: number;
}

const VALID_INTENT_TYPES = new Set([
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
const VALID_SOURCES = new Set(['chain', 'direct_write', 'seeding', 'calibrator']);

async function fetchRecentRingEntries(brainId: string) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/institutional_ring?select=*&brain_id=eq.${brainId}&created_at=gt.now()::timestamp - interval '10 minutes'`;
  const response = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
  });

  if (!response.ok) {
    throw new LibrarianError('Failed to fetch recent ring entries', 'SUPABASE_FETCH_FAILED');
  }

  return response.json();
}

function validateAddressKey(addressKey: string): boolean {
  const parts = addressKey.split('.');
  if (parts.length !== 4) return false;
  if (!parts[0] || !VALID_INTENT_TYPES.has(parts[0])) return false;
  if (!parts[1] || !VALID_SCOPES.has(parts[1])) return false;
  if (!parts[2] || !parts[3]) return false;
  return true;
}

async function checkAddressKeyValidity(brainId: string): Promise<IntegrityCheckResult> {
  const entries = await fetchRecentRingEntries(brainId);
  const failures: string[] = [];

  for (const entry of entries as Record<string, unknown>[]) {
    if (!validateAddressKey(entry.address_key as string)) {
      failures.push(`Entry ${entry.id} has invalid address key: ${entry.address_key}`);
    }
  }

  return {
    check: 'address_key_validity',
    passed: failures.length === 0,
    failures,
    checked_at: new Date().toISOString(),
  };
}

async function checkWritePathSource(brainId: string): Promise<IntegrityCheckResult> {
  const entries = await fetchRecentRingEntries(brainId);
  const failures: string[] = [];

  for (const entry of entries as Record<string, unknown>[]) {
    if (!entry.source || !VALID_SOURCES.has(entry.source as string)) {
      failures.push(`Entry ${entry.id} has invalid source: ${entry.source}`);
    }
  }

  return {
    check: 'write_path_source',
    passed: failures.length === 0,
    failures,
    checked_at: new Date().toISOString(),
  };
}

async function checkLeafImmutability(brainId: string): Promise<IntegrityCheckResult> {
  const url = `${process.env.SUPABASE_URL}/rest/v1/institutional_ring?select=*&brain_id=eq.${brainId}&entry_level=eq.leaf&superseded_by=not.is.null`;
  const response = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
  });

  if (!response.ok) {
    throw new LibrarianError('Failed to fetch leaf entries', 'SUPABASE_FETCH_FAILED');
  }

  const entries = await response.json();
  const failures = (entries as Record<string, unknown>[]).filter(entry => entry.superseded_by !== null && entry.superseded_by !== undefined).map((entry) => `Entry ${entry.id} is a leaf but has superseded_by set`);

  return {
    check: 'leaf_immutability',
    passed: failures.length === 0,
    failures,
    checked_at: new Date().toISOString(),
  };
}

async function checkCoverageMapConsistency(brainId: string): Promise<IntegrityCheckResult> {
  const entries = await fetchRecentRingEntries(brainId);
  const uniqueAddressKeys = [...new Set((entries as Record<string, unknown>[]).map((entry) => entry.address_key as string))];
  const failures: string[] = [];

  for (const addressKey of uniqueAddressKeys) {
    const exists = await shardC.get(`coverage_map:${brainId}:${addressKey}`);
    if (!exists) {
      failures.push(`Missing Coverage Map entry for address key: ${addressKey}`);
    }
  }

  return {
    check: 'coverage_map_consistency',
    passed: failures.length === 0,
    failures,
    checked_at: new Date().toISOString(),
  };
}

export async function runRingIntegrity(brainId: string): Promise<RingIntegrityReport> {
  const startTime = Date.now();
  const checks: IntegrityCheckResult[] = [];

  try {
    checks.push(await checkAddressKeyValidity(brainId));
    checks.push(await checkWritePathSource(brainId));
    checks.push(await checkLeafImmutability(brainId));
    checks.push(await checkCoverageMapConsistency(brainId));
  } catch (error) {
    throw new LibrarianError(`Ring integrity check failed: ${error}`, 'RING_INTEGRITY_FAILED');
  }

  const passed = checks.every((check) => check.passed);
  return {
    brain_id: brainId,
    passed,
    checks,
    run_at: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
  };
}