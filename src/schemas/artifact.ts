import { z } from 'zod';
import { AddressKeySchema } from './ring';
import { RoleNameSchema } from './anchor';

/**
 * @typedef {typeof ArtifactStatusSchema._type} ArtifactStatus
 */
export const ArtifactStatusSchema = z.enum(['complete', 'partial']);
export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;

/**
 * @typedef {typeof ProvenanceSchema._type} Provenance
 */
export const ProvenanceSchema = z.object({
  address_key: AddressKeySchema,
  data_points_accessed: z.array(z.string()).min(1, 'data_points_accessed cannot be an empty array'),
  chunked: z.boolean(),
  domain_uncertainty: z.boolean(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

/**
 * @typedef {typeof AnchorTraceEntrySchema._type} AnchorTraceEntry
 */
export const AnchorTraceEntrySchema = z.object({
  role: RoleNameSchema,
  status: z.enum(['complete', 'failed', 'skipped']),
  written_at: z.string().datetime(),
  summary: z.string().optional(),
});
export type AnchorTraceEntry = z.infer<typeof AnchorTraceEntrySchema>;

/**
 * @typedef {typeof ArtifactOutputSchema._type} ArtifactOutput
 */
export const ArtifactOutputSchema = z.object({
  session_id: z.string().uuid(),
  brain_id: z.string().uuid(),
  status: ArtifactStatusSchema,
  address_key: AddressKeySchema,
  content: z.unknown(),
  confidence_score: z.number().min(0).max(100),
  gate_decision: z.enum(['pass', 'fail', 'pass_with_warning']),
  provenance: ProvenanceSchema,
  anchor_trace: z.array(AnchorTraceEntrySchema),
  created_at: z.string().datetime(),
});
export type ArtifactOutput = z.infer<typeof ArtifactOutputSchema>;

/**
 * @typedef {typeof PartialArtifactOutputSchema._type} PartialArtifactOutput
 */
export const PartialArtifactOutputSchema = ArtifactOutputSchema.extend({
  status: z.literal('partial'),
  content: z.unknown().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
  gate_decision: z.enum(['pass', 'fail', 'pass_with_warning']).optional(),
});
export type PartialArtifactOutput = z.infer<typeof PartialArtifactOutputSchema>;
