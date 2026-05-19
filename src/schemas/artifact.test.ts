import { describe, it, expect } from 'vitest';
import {
  ArtifactOutputSchema,
  PartialArtifactOutputSchema,
  AnchorTraceEntrySchema,
  ProvenanceSchema,
} from './artifact';

describe('Artifact Schemas', () => {
  const commonProvenance = {
    address_key: 'specification.org.domain.specificity',
    data_points_accessed: ['data1', 'data2'],
    chunked: false,
    domain_uncertainty: false,
  };

  const commonAnchorTraceEntry = {
    role: 'triage',
    status: 'complete',
    written_at: new Date().toISOString(),
  };

  const commonArtifactOutput = {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    brain_id: '123e4567-e89b-12d3-a456-426614174001',
    address_key: 'specification.org.domain.specificity',
    provenance: commonProvenance,
    anchor_trace: [commonAnchorTraceEntry],
    created_at: new Date().toISOString(),
  };

  it('ArtifactOutputSchema accepts a valid complete artifact', () => {
    const validCompleteArtifact = {
      ...commonArtifactOutput,
      status: 'complete',
      content: { result: 'all good' },
      confidence_score: 95,
      gate_decision: 'pass',
    };
    expect(() => ArtifactOutputSchema.parse(validCompleteArtifact)).not.toThrow();
  });

  it('ArtifactOutputSchema rejects an artifact where status is "partial" with missing confidence_score (confidence_score is required on complete)', () => {
    const invalidArtifact = {
      ...commonArtifactOutput,
      status: 'complete',
      content: { result: 'some result' },
      // confidence_score is missing
      gate_decision: 'pass',
    };
    expect(() => ArtifactOutputSchema.parse(invalidArtifact)).toThrow();
  });

  it('PartialArtifactOutputSchema accepts a payload with status "partial" and no content or confidence_score', () => {
    const validPartialArtifact = {
      ...commonArtifactOutput,
      status: 'partial',
      // content is optional
      // confidence_score is optional
      // gate_decision is optional
    };
    expect(() => PartialArtifactOutputSchema.parse(validPartialArtifact)).not.toThrow();
  });

  it('PartialArtifactOutputSchema rejects a payload where status is "complete"', () => {
    const invalidPartialArtifact = {
      ...commonArtifactOutput,
      status: 'complete',
      content: { result: 'all good' },
      confidence_score: 80,
      gate_decision: 'pass',
    };
    expect(() => PartialArtifactOutputSchema.parse(invalidPartialArtifact)).toThrow();
  });

  it('AnchorTraceEntrySchema rejects an entry with invalid role name', () => {
    const invalidTraceEntry = {
      role: 'invalid_role', // Invalid role name
      status: 'complete',
      written_at: new Date().toISOString(),
    };
    expect(() => AnchorTraceEntrySchema.parse(invalidTraceEntry)).toThrow();
  });

  it('ProvenanceSchema rejects empty data_points_accessed array', () => {
    const invalidProvenance = {
      ...commonProvenance,
      data_points_accessed: [],
    };
    expect(() => ProvenanceSchema.parse(invalidProvenance)).toThrow();
  });
});
