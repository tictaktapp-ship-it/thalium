import { writeContribution } from '../lib/anchor';
import { AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from '../lib/librarian-write';
import { createClient } from '@supabase/supabase-js';

export interface BoundaryCheckResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
  action: 'allow' | 'block' | 'warn';
}

export interface BoundaryKeeperResult {
  output: BoundaryCheckResult;
  anchor_contribution: AnchorContribution;
}

export async function enforceeBoundaries(
  sessionId: string,
  artifact: string,
  domain: string,
  brainId: string
): Promise<BoundaryKeeperResult> {
  if (!artifact || !domain) {
    throw new LibrarianError('Artifact and domain are required', 'VALIDATION_FAILED');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new LibrarianError('Supabase credentials are missing', 'CONFIGURATION_ERROR');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let rules: { blocked_terms?: string[] } = {};
  try {
    const { data, error } = await supabase
      .from('institutional_ring')
      .select('*')
      .eq('address_key', `boundary_rules.${domain}`)
      .eq('brain_id', brainId)
      .single();

    if (error) {
      console.warn(`Failed to fetch boundary rules: ${error.message}`);
    } else {
      rules = data;
    }
  } catch (err) {
    console.warn(`Error fetching boundary rules: ${err}`);
  }

  const blockedTerms = rules.blocked_terms || ['<script', 'DROP TABLE', 'rm -rf'];
  const violations: string[] = [];
  const warnings: string[] = [];

  blockedTerms.forEach(term => {
    if (artifact.includes(term)) {
      violations.push(`Blocked term detected: ${term}`);
    }
  });

  if (artifact.length > 50000) {
    warnings.push('Artifact exceeds recommended length');
  }

  const action: 'allow' | 'block' | 'warn' = violations.length > 0
    ? 'block'
    : warnings.length > 0
    ? 'warn'
    : 'allow';

  const passed = action === 'allow' || action === 'warn';

  const boundaryCheckResult: BoundaryCheckResult = {
    passed,
    violations,
    warnings,
    action,
  };

  const contribution: AnchorContribution = {
    role: 'boundary_keeper',
    status: 'complete',
    written_at: new Date().toISOString(),
    payload: boundaryCheckResult,
  };

  await writeContribution(sessionId, contribution);

  return {
    output: boundaryCheckResult,
    anchor_contribution: contribution,
  };
}