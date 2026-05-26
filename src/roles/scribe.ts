import { readAnchor, writeContribution } from '../lib/anchor';
import { AnchorContribution } from '../schemas/anchor';
import { ArtifactOutput } from '../schemas/artifact';
import { LibrarianError } from '../lib/librarian-write';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface ScribeResult {
  artifact: ArtifactOutput;
  anchor_contribution: AnchorContribution;
}

export async function scribe(
  sessionId: string,
  brainId: string,
  addressKey: string
): Promise<ScribeResult> {
  try {
    const anchor = await readAnchor(sessionId);
    const architectContribution = anchor.contributions.find(
      (c) => c.role === 'architect'
    );
    if (!architectContribution) {
      throw new LibrarianError('Architect contribution missing', 'VALIDATION_FAILED');
    }
    const scorerContribution = anchor.contributions.find(
      (c) => c.role === 'scorer'
    );
    if (!scorerContribution) {
      throw new LibrarianError('Scorer contribution missing', 'VALIDATION_FAILED');
    }
    const artifact: ArtifactOutput = {
      session_id: sessionId,
      brain_id: brainId,
      status: 'complete',
      address_key: addressKey,
      content: (architectContribution.payload as Record<string, unknown>).structured_artifact as unknown,
      confidence_score: (scorerContribution.payload as Record<string, unknown>).confidence_score as number,
      gate_decision: (scorerContribution.payload as Record<string, unknown>).gate_decision as 'pass' | 'fail' | 'pass_with_warning',
      provenance: {
        address_key: addressKey,
        data_points_accessed: [],
        chunked: false,
        domain_uncertainty: false
      },
      anchor_trace: anchor.contributions.map((c) => ({
        role: c.role,
        status: c.status,
        written_at: c.written_at,
        summary: ''
      })),
      created_at: new Date().toISOString()
    };

    const scribeContribution: AnchorContribution = {
      role: 'scribe',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: {
        artifact_assembled: true,
        session_id: sessionId
      },
    };

    await writeContribution(sessionId, scribeContribution);

    // Persist artifact to Supabase — fire and forget, never blocks return
    pool.query(
      `INSERT INTO artifacts (session_id, brain_id, status, address_key, content, confidence_score, gate_decision, provenance, anchor_trace, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        artifact.session_id,
        artifact.brain_id,
        artifact.status,
        artifact.address_key,
        JSON.stringify(artifact.content),
        artifact.confidence_score,
        artifact.gate_decision,
        JSON.stringify(artifact.provenance),
        JSON.stringify(artifact.anchor_trace),
        artifact.created_at
      ]
    ).then(() => {
      console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', component: 'scribe', message: 'Artifact persisted', session_id: sessionId }));
    }).catch((err: unknown) => {
      console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', component: 'scribe', message: 'Artifact persistence failed', session_id: sessionId, error: err instanceof Error ? err.message : 'Unknown error' }));
    });

    return {
      artifact,
      anchor_contribution: scribeContribution
    };
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    throw new LibrarianError('Failed to assemble artifact', 'SCRIBE_FAILED');
  }
}