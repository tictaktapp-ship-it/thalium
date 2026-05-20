import { Redis } from '@upstash/redis';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const AuditEventSchema = z.object({
  id: z.string().min(1),
  brain_id: z.string().min(1),
  event_type: z.string(),
  actor_type: z.enum(['api_key', 'system', 'calibrator', 'subscriber']),
  actor_id: z.string(),
  payload: z.record(z.unknown()),
  created_at: z.string().datetime(),
});

export interface AuditEvent extends z.infer<typeof AuditEventSchema> {}
export type BuildAuditEventParams = Omit<AuditEvent, 'id' | 'created_at'> & Partial<Pick<AuditEvent, 'id' | 'created_at'>>;

export const AUDIT_EVENTS = {
  INVOCATION_STARTED: 'invocation.started',
  INVOCATION_COMPLETED: 'invocation.completed',
  INVOCATION_FAILED: 'invocation.failed',
  CALIBRATION_COMPLETE: 'calibration.complete',
  CALIBRATION_ROLLBACK: 'calibration.rollback',
  OUTCOME_RECORDED: 'outcome.recorded',
  CONFIG_UPDATED: 'config.updated',
  CONFIG_PRESET_APPLIED: 'config.preset_applied',
  MEMORY_WRITTEN: 'memory.written',
  MEMORY_DELETED: 'memory.deleted',
  RING_ENTRY_RECLASSIFIED: 'ring_entry.reclassified',
  CONTESTED_ENTRY_RESOLVED: 'contested_entry.resolved',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',
  BRAIN_CREATED: 'brain.created',
  SNAPSHOT_CREATED: 'snapshot.created',
  SNAPSHOT_RESTORED: 'snapshot.restored',
} as const;

const shardB = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_B_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_B_TOKEN!,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function buildAuditEvent(params: BuildAuditEventParams): AuditEvent {
  const event = {
    id: params.id ?? randomUUID(),
    created_at: params.created_at ?? new Date().toISOString(),
    ...params,
  };

  return AuditEventSchema.parse(event);
}

export async function writeAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await shardB.lpush('audit_queue', JSON.stringify(event));
  } catch (redisError) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      component: 'audit-fallback',
      brain_id: event.brain_id,
      message: 'Redis Shard B write failed, falling back to Postgres',
      error: redisError instanceof Error ? redisError.message : String(redisError),
    };
    console.log(JSON.stringify(logEntry));

    await writeAuditEventDirect(event);
  }
}

export async function writeAuditEventDirect(event: AuditEvent): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO audit_log (id, brain_id, event_type, actor_type, actor_id, payload, created_at) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)',
      [event.id, event.brain_id, event.event_type, event.actor_type, event.actor_id, event.payload, event.created_at]
    );
  } catch (pgError) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'audit-fallback',
      brain_id: event.brain_id,
      message: 'Postgres audit log write failed',
      error: pgError instanceof Error ? pgError.message : String(pgError),
    };
    console.log(JSON.stringify(logEntry));
  }
}