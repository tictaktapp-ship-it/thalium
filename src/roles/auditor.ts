import { readAnchor, writeContribution } from '../lib/anchor';
import { AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from '../lib/librarian-write';

export interface AuditEntry {
  session_id: string;
  brain_id: string;
  address_key: string;
  event_type: string;
  roles_activated: string[];
  gate_decision: string;
  confidence_score: number;
  duration_ms: number;
  payload: Record<string, unknown>;
}

export interface AuditorResult {
  audit_entry: AuditEntry;
  anchor_contribution: AnchorContribution;
}

export async function audit(
  sessionId: string,
  brainId: string,
  addressKey: string,
  startedAt: Date
): Promise<AuditorResult> {
  try {
    const anchor = await readAnchor(sessionId);
    const rolesActivated = anchor.contributions.map(contribution => contribution.role);
    const scorerContribution = anchor.contributions.find(contribution => contribution.role === 'scorer');
    const scorerPayload = scorerContribution?.payload as Record<string, unknown> | undefined;
    const gateDecision = scorerPayload?.gate_decision as string || 'unknown';
    const confidenceScore = scorerPayload?.confidence_score as number || 0;
    const durationMs = Date.now() - startedAt.getTime();

    const auditEntry: AuditEntry = {
      session_id: sessionId,
      brain_id: brainId,
      address_key: addressKey,
      event_type: 'chain.complete',
      roles_activated: rolesActivated,
      gate_decision: gateDecision,
      confidence_score: confidenceScore,
      duration_ms: durationMs,
      payload: {}
    };

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new LibrarianError('Missing Supabase configuration', 'CONFIG_MISSING');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(auditEntry)
    });

    if (!response.ok) {
      throw new LibrarianError('Failed to write audit log', 'WRITE_FAILED');
    }

    const contribution: AnchorContribution = {
      role: 'auditor',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: {
        audit_entry_written: true,
        event_type: 'chain.complete'
      }
    };

    await writeContribution(sessionId, contribution);

    return {
      audit_entry: auditEntry,
      anchor_contribution: contribution
    };
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    throw new LibrarianError('Unexpected error during audit', 'UNEXPECTED_ERROR');
  }
}