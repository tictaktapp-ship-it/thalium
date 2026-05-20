import { Request, Response } from 'express';
import { Pool } from 'pg';
import { Redis } from '@upstash/redis';
import { z } from 'zod';

const ComponentHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down']),
  latency_ms: z.number(),
  error: z.string().optional(),
});

const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down']),
  timestamp: z.string(),
  app: z.string(),
  version: z.string(),
  components: z.object({
    postgres: ComponentHealthSchema,
    redis_shard_a: ComponentHealthSchema,
    redis_shard_b: ComponentHealthSchema,
    redis_shard_c: ComponentHealthSchema,
  }),
});

type ComponentHealth = z.infer<typeof ComponentHealthSchema>;
type HealthStatus = z.infer<typeof HealthStatusSchema>;

const POSTGRES_TIMEOUT_MS = 3000;
const POSTGRES_DEGRADED_THRESHOLD_MS = 2000;
const REDIS_TIMEOUT_MS = 1000;
const REDIS_DEGRADED_THRESHOLD_MS = 500;

const appName = process.env.APP_NAME ?? 'thalium-api';
const version = process.env.npm_package_version ?? '0.0.0';

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

const redisShardA = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_A_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_A_TOKEN!,
});

const redisShardB = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_B_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_B_TOKEN!,
});

const redisShardC = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_C_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_C_TOKEN!,
});

async function checkPostgres(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await Promise.race([
      pgPool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), POSTGRES_TIMEOUT_MS)),
    ]);
    const latency = Date.now() - start;
    return {
      status: latency < POSTGRES_DEGRADED_THRESHOLD_MS ? 'healthy' : 'degraded',
      latency_ms: latency,
    };
  } catch (error) {
    return {
      status: 'down',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

async function checkRedis(redis: Redis, shardName: string): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await Promise.race([
      redis.get<string>('health:ping'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), REDIS_TIMEOUT_MS)),
    ]);
    const latency = Date.now() - start;
    return {
      status: latency < REDIS_DEGRADED_THRESHOLD_MS ? 'healthy' : 'degraded',
      latency_ms: latency,
    };
  } catch (error) {
    return {
      status: 'down',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

export async function checkHealth(): Promise<HealthStatus> {
  const timestamp = new Date().toISOString();
  const [postgres, redisA, redisB, redisC] = await Promise.all([
    checkPostgres(),
    checkRedis(redisShardA, 'redis_shard_a'),
    checkRedis(redisShardB, 'redis_shard_b'),
    checkRedis(redisShardC, 'redis_shard_c'),
  ]);

  const componentStatuses = [postgres.status, redisA.status, redisB.status, redisC.status];
  const overallStatus = componentStatuses.includes('down')
    ? 'down'
    : componentStatuses.includes('degraded')
    ? 'degraded'
    : 'healthy';

  return {
    status: overallStatus,
    timestamp,
    app: appName,
    version,
    components: {
      postgres,
      redis_shard_a: redisA,
      redis_shard_b: redisB,
      redis_shard_c: redisC,
    },
  };
}

export async function healthHandler(req: Request, res: Response): Promise<void> {
  try {
    const healthStatus = await checkHealth();
    res.status(200).json(HealthStatusSchema.parse(healthStatus));
  } catch (error) {
    res.status(200).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      app: appName,
      version,
      components: {
        postgres: { status: 'down', latency_ms: 0, error: 'health check failed' },
        redis_shard_a: { status: 'down', latency_ms: 0, error: 'health check failed' },
        redis_shard_b: { status: 'down', latency_ms: 0, error: 'health check failed' },
        redis_shard_c: { status: 'down', latency_ms: 0, error: 'health check failed' },
      },
    });
  }
}