import { z } from 'zod';
import { AddressKeySchema } from './ring';

/**
 * @typedef {typeof RoleNameSchema._type} RoleName
 */
export const RoleNameSchema = z.enum([
  'triage',
  'listener',
  'interrogator',
  'architect',
  'devil',
  'scorer',
  'validator',
  'boundary_keeper',
  'scribe',
  'auditor',
  'librarian',
  'router',
  'forecaster',
  'epidemiologist',
  'calibrator',
  'consolidation_monitor',
  'confidence_monitor',
  'health_monitor',
  'sentinel',
  'reconsolidator',
  'buffer_drain',
  'seeder',
  'ring_integrity',
  'archivist',
  'boundary_enforcer',
]);
export type RoleName = z.infer<typeof RoleNameSchema>;

/**
 * @typedef {typeof RoleStatusSchema._type} RoleStatus
 */
export const RoleStatusSchema = z.enum(['complete', 'failed', 'skipped']);
export type RoleStatus = z.infer<typeof RoleStatusSchema>;

/**
 * @typedef {typeof AnchorContributionSchema._type} AnchorContribution
 */
export const AnchorContributionSchema = z.object({
  role: RoleNameSchema,
  status: RoleStatusSchema,
  written_at: z.string().datetime(),
  payload: z.unknown(),
});
export type AnchorContribution = z.infer<typeof AnchorContributionSchema>;

/**
 * @typedef {typeof AnchorStateSchema._type} AnchorState
 */
export const AnchorStateSchema = z.object({
  session_id: z.string().uuid(),
  brain_id: z.string().uuid(),
  address_key: z.string().min(1),
  created_at: z.string().datetime(),
  last_refreshed_at: z.string().datetime(),
  contributions: z.array(AnchorContributionSchema),
  paused_at: z.string().datetime().nullable(),
  pause_timeout_minutes: z.number().int().positive().default(10),
});
export type AnchorState = z.infer<typeof AnchorStateSchema>;
