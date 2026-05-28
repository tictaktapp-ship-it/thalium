import { readAnchor, writeContribution } from '../lib/anchor';
import { AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from '../lib/librarian-write';
import { z } from 'zod';

export interface ValidatorOutput {
  verdict: 'approved' | 'rejected' | 'reclassify' | 'novel_signal';
  confidence_score: number;
  threshold_used: number;
  reclassification_count: number;
  reasoning: string;
}

export interface ValidatorResult {
  output: ValidatorOutput;
  anchor_contribution: AnchorContribution;
}

export const MAX_RECLASSIFICATION_ATTEMPTS = 1;
export const DEFAULT_CONFIDENCE_THRESHOLD = 50;

const ScorerPayloadSchema = z.object({
  confidence_score: z.number().min(0).max(100),
  gate_decision: z.enum(['pass', 'fail', 'pass_with_warning']),
});

export async function validate(
  sessionId: string,
  intentType: string,
  confidenceThreshold?: number
): Promise<ValidatorResult> {
  try {
    const anchor = await readAnchor(sessionId);
    const scorerContribution = anchor.contributions.find(
      (c) => c.role === 'scorer'
    );

    if (!scorerContribution) {
      throw new LibrarianError('Scorer contribution not found', 'VALIDATION_FAILED');
    }

    const scorerPayload = ScorerPayloadSchema.parse(scorerContribution.payload);
    const reclassificationCount = anchor.contributions.filter(
      (c) => c.role === 'validator'
    ).length;

    const threshold = confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
    let verdict: ValidatorOutput['verdict'];
    let reasoning = '';

    if (scorerPayload.gate_decision === 'fail') {
      if (reclassificationCount < MAX_RECLASSIFICATION_ATTEMPTS) {
        verdict = 'reclassify';
        reasoning = `Reclassification attempt ${reclassificationCount + 1} of ${MAX_RECLASSIFICATION_ATTEMPTS}`;
      } else {
        verdict = 'novel_signal';
        reasoning = 'Maximum reclassification attempts reached';
      }
    } else if (scorerPayload.gate_decision === 'pass' || (scorerPayload.gate_decision === 'pass_with_warning' && scorerPayload.confidence_score >= threshold)) {
      verdict = 'approved';
      reasoning = scorerPayload.gate_decision === 'pass_with_warning' ? 'Approved with warnings from Devil' : 'Confidence score meets threshold';
    } else {
      verdict = 'rejected';
      reasoning = 'Confidence score below threshold';
    }

    const validatorOutput: ValidatorOutput = {
      verdict,
      confidence_score: scorerPayload.confidence_score,
      threshold_used: threshold,
      reclassification_count: reclassificationCount,
      reasoning,
    };

    const contribution: AnchorContribution = {
      role: 'validator',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: validatorOutput,
    };

    await writeContribution(sessionId, contribution);

    return {
      output: validatorOutput,
      anchor_contribution: contribution,
    };
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new LibrarianError(
        `Invalid scorer payload: ${error.errors.join(', ')}`,
        'VALIDATION_FAILED'
      );
    }
    throw new LibrarianError(
      `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
      'VALIDATION_FAILED'
    );
  }
}