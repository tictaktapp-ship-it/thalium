import { z } from 'zod';
import { AddressKeySchema } from './ring';

/**
 * @typedef {typeof ModelRegistryEntrySchema._type} ModelRegistryEntry
 */
export const ModelRegistryEntrySchema = z.object({
  id: z.string().uuid(),
  provider: z.string().min(1, 'provider cannot be empty'),
  model_id: z.string().min(1, 'model_id cannot be empty'),
  health_status: z.enum(['healthy', 'degraded', 'down']),
  last_checked_at: z.string().datetime(),
  latency_p95_ms: z.number().positive().optional(),
  error_rate: z.number().min(0).max(1).optional(),
});
export type ModelRegistryEntry = z.infer<typeof ModelRegistryEntrySchema>;

/**
 * @typedef {typeof WriteStagingEntrySchema._type} WriteStagingEntry
 */
export const WriteStagingEntrySchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  brain_id: z.string().uuid(),
  address_key: AddressKeySchema,
  payload: z.unknown(),
  created_at: z.string().datetime(),
  processed_at: z.string().datetime().nullable(),
});
export type WriteStagingEntry = z.infer<typeof WriteStagingEntrySchema>;

/**
 * @typedef {typeof NovelSignalEntrySchema._type} NovelSignalEntry
 */
export const NovelSignalEntrySchema = z.object({
  id: z.string().uuid(),
  brain_id: z.string().uuid(),
  raw_input: z.string().min(1, 'raw_input cannot be empty'),
  prediction_error_score: z.number().min(0).max(1),
  session_id: z.string().uuid(),
  created_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable(),
  resolution: z.string().optional(),
});
export type NovelSignalEntry = z.infer<typeof NovelSignalEntrySchema>;
