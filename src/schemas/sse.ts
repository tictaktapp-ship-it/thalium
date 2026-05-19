import { z } from 'zod';
import { RoleNameSchema } from './anchor';

/**
 * @typedef {typeof SSEEventSchema._type} SSEEvent
 */
export const SSEEventSchema = z.object({
  id: z.string(),
  event: z.string(),
  data: z.unknown(),
  retry: z.number().int().positive().optional(),
});
export type SSEEvent = z.infer<typeof SSEEventSchema>;

/**
 * @typedef {typeof FastTriageEventSchema._type} FastTriageEvent
 */
export const FastTriageEventSchema = SSEEventSchema.extend({
  event: z.literal('fast.triage'),
});
export type FastTriageEvent = z.infer<typeof FastTriageEventSchema>;

/**
 * @typedef {typeof FastArtifactEventSchema._type} FastArtifactEvent
 */
export const FastArtifactEventSchema = SSEEventSchema.extend({
  event: z.literal('fast.artifact'),
});
export type FastArtifactEvent = z.infer<typeof FastArtifactEventSchema>;

/**
 * @typedef {typeof FullRoleEventSchema._type} FullRoleEvent
 */
export const FullRoleEventSchema = SSEEventSchema.extend({
  event: z.custom<`full.${z.infer<typeof RoleNameSchema>}`>(
    (val) => {
      if (typeof val !== 'string') return false;
      const parts = val.split('.');
      if (parts.length !== 2 || parts[0] !== 'full') return false;
      return RoleNameSchema.safeParse(parts[1]).success;
    },
    { message: 'Invalid full.{role} event name' }
  ),
});
export type FullRoleEvent = z.infer<typeof FullRoleEventSchema>;

/**
 * @typedef {typeof FullArtifactEventSchema._type} FullArtifactEvent
 */
export const FullArtifactEventSchema = SSEEventSchema.extend({
  event: z.literal('full.artifact'),
});
export type FullArtifactEvent = z.infer<typeof FullArtifactEventSchema>;

/**
 * @typedef {typeof ChainChunkedEventSchema._type} ChainChunkedEvent
 */
export const ChainChunkedEventSchema = SSEEventSchema.extend({
  event: z.literal('chain.chunked'),
  data: z.object({
    chunked: z.literal(true),
  }).passthrough(),
});
export type ChainChunkedEvent = z.infer<typeof ChainChunkedEventSchema>;

/**
 * @typedef {typeof ChainNovelEventSchema._type} ChainNovelEvent
 */
export const ChainNovelEventSchema = SSEEventSchema.extend({
  event: z.literal('chain.novel'),
});
export type ChainNovelEvent = z.infer<typeof ChainNovelEventSchema>;

/**
 * @typedef {typeof ChainPartialEventSchema._type} ChainPartialEvent
 */
export const ChainPartialEventSchema = SSEEventSchema.extend({
  event: z.literal('chain.partial'),
});
export type ChainPartialEvent = z.infer<typeof ChainPartialEventSchema>;

/**
 * @typedef {typeof ChainTimeoutEventSchema._type} ChainTimeoutEvent
 */
export const ChainTimeoutEventSchema = SSEEventSchema.extend({
  event: z.literal('chain.timeout'),
});
export type ChainTimeoutEvent = z.infer<typeof ChainTimeoutEventSchema>;

/**
 * @typedef {typeof InstanceConsolidatingEventSchema._type} InstanceConsolidatingEvent
 */
export const InstanceConsolidatingEventSchema = SSEEventSchema.extend({
  event: z.literal('instance.consolidating'),
});
export type InstanceConsolidatingEvent = z.infer<typeof InstanceConsolidatingEventSchema>;

/**
 * @typedef {typeof InstanceDomainUncertaintyEventSchema._type} InstanceDomainUncertaintyEvent
 */
export const InstanceDomainUncertaintyEventSchema = SSEEventSchema.extend({
  event: z.literal('instance.domain_uncertainty'),
});
export type InstanceDomainUncertaintyEvent = z.infer<typeof InstanceDomainUncertaintyEventSchema>;

/**
 * @typedef {typeof InstanceResumedEventSchema._type} InstanceResumedEvent
 */
export const InstanceResumedEventSchema = SSEEventSchema.extend({
  event: z.literal('instance.resumed'),
});
export type InstanceResumedEvent = z.infer<typeof InstanceResumedEventSchema>;

/**
 * @typedef {typeof InstancePostgresDegradedEventSchema._type} InstancePostgresDegradedEvent
 */
export const InstancePostgresDegradedEventSchema = SSEEventSchema.extend({
  event: z.literal('instance.postgres_degraded'),
});
export type InstancePostgresDegradedEvent = z.infer<typeof InstancePostgresDegradedEventSchema>;

/**
 * @typedef {typeof ChainNovelQueueFullEventSchema._type} ChainNovelQueueFullEvent
 */
export const ChainNovelQueueFullEventSchema = SSEEventSchema.extend({
  event: z.literal('chain.novel_queue_full'),
});
export type ChainNovelQueueFullEvent = z.infer<typeof ChainNovelQueueFullEventSchema>;

/**
 * @typedef {typeof SSEAnyEventSchema._type} SSEAnyEvent
 */
export const SSEAnyEventSchema = z.union([
  FastTriageEventSchema,
  FastArtifactEventSchema,
  FullRoleEventSchema,
  FullArtifactEventSchema,
  ChainChunkedEventSchema,
  ChainNovelEventSchema,
  ChainPartialEventSchema,
  ChainTimeoutEventSchema,
  InstanceConsolidatingEventSchema,
  InstanceDomainUncertaintyEventSchema,
  InstanceResumedEventSchema,
  InstancePostgresDegradedEventSchema,
  ChainNovelQueueFullEventSchema,
]);
export type SSEAnyEvent = z.infer<typeof SSEAnyEventSchema>;
