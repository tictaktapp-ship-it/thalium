import { readAnchor, writeContribution } from '../lib/anchor';
import { shardC } from '../lib/redis';
import { AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from '../lib/librarian-write';
import { z } from 'zod';

export interface ScorerOutput {
  confidence_score: number;
  gate_decision: 'pass' | 'fail' | 'pass_with_warning';
  score_breakdown: {
    architect_confidence: number;
    devil_risk_score: number;
    devil_verdict_weight: number;
    ring_coverage_weight: number;
  };
  reasoning: string;
}

export interface ScorerResult {
  output: ScorerOutput;
  anchor_contribution: AnchorContribution;
}

export const DEFAULT_PASS_THRESHOLD = 60;

const RuleWeightsSchema = z.object({
  architect_weight: z.number().min(0).max(1),
  devil_weight: z.number().min(0).max(1),
  coverage_weight: z.number().min(0).max(1),
});

const DefaultRuleWeights = {
  architect_weight: 0.4,
  devil_weight: 0.4,
  coverage_weight: 0.2,
};

export async function score(
  sessionId: string,
  brainId: string,
  addressKey: string
): Promise<ScorerResult> {
  try {
    const anchor = await readAnchor(sessionId);
    if (!anchor) {
      throw new LibrarianError('Anchor not found', 'ANCHOR_NOT_FOUND');
    }

    const architectContribution = anchor.contributions.find(
      (c) => c.role === 'architect'
    );
    const devilContribution = anchor.contributions.find(
      (c) => c.role === 'devil'
    );

    if (!architectContribution || !devilContribution) {
      throw new LibrarianError(
        'Missing required contributions',
        'MISSING_CONTRIBUTIONS'
      );
    }

    const archPayload = architectContribution.payload as { confidence: number };
    const devilPayload = devilContribution.payload as { 
      risk_score: number; 
      verdict: 'pass' | 'pass_with_concerns' | 'fail' 
    };

    const ruleWeightsKey = `rule_weights:${brainId}:${addressKey}`;
    let ruleWeights = DefaultRuleWeights;

    try {
      const rawWeights = await shardC.get(ruleWeightsKey);
      if (rawWeights) {
        ruleWeights = RuleWeightsSchema.parse(rawWeights);
      }
    } catch (error) {
      throw new LibrarianError(
        'Failed to parse rule weights',
        'RULE_WEIGHTS_PARSE_ERROR'
      );
    }

    const architectConfidence = archPayload.confidence * 100;
    const devilRiskScore = devilPayload.risk_score * 100;
    const devilVerdictWeight =
      devilPayload.verdict === 'pass'
        ? 100
        : devilPayload.verdict === 'pass_with_concerns'
        ? 60
        : 20;
    const ringCoverageWeight = 50;

    const confidenceScore =
      architectConfidence * ruleWeights.architect_weight +
      (100 - devilRiskScore) * ruleWeights.devil_weight +
      ringCoverageWeight * ruleWeights.coverage_weight;

    const gateDecision =
      confidenceScore >= DEFAULT_PASS_THRESHOLD &&
      devilPayload.verdict !== 'fail'
        ? devilPayload.verdict === 'pass_with_concerns'
          ? 'pass_with_warning'
          : 'pass'
        : 'fail';

    const scorerOutput: ScorerOutput = {
      confidence_score: confidenceScore,
      gate_decision: gateDecision,
      score_breakdown: {
        architect_confidence: architectConfidence,
        devil_risk_score: devilRiskScore,
        devil_verdict_weight: devilVerdictWeight,
        ring_coverage_weight: ringCoverageWeight,
      },
      reasoning: `Computed score based on architect confidence, devil risk assessment, and ring coverage`,
    };

    const contribution: AnchorContribution = {
      role: 'scorer',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: scorerOutput,
    };

    await writeContribution(sessionId, contribution);

    return {
      output: scorerOutput,
      anchor_contribution: contribution,
    };
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    throw new LibrarianError(
      'Unexpected error in scorer',
      'SCORER_UNEXPECTED_ERROR'
    );
  }
}