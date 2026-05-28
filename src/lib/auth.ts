import { createHash } from 'crypto';
import { Pool } from 'pg';
import { Redis } from '@upstash/redis';

export interface ApiKeyRecord {
  id: string;
  brain_id: string;
  scopes: string[];
  rate_limit_per_minute: number;
  expires_at: string | null;
  revoked_at: string | null;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: number;
}

const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const shardB = new Redis({
  url: process.env.REDIS_SHARD_B_URL,
  token: process.env.REDIS_SHARD_B_TOKEN,
});

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

export async function validateApiKey(apiKey: string): Promise<ApiKeyRecord | null> {
  const keyHash = hashApiKey(apiKey);
  try {
    const result = await dbPool.query<ApiKeyRecord>({
      text: `
        SELECT id, brain_id, scopes, rate_limit_per_minute, expires_at, revoked_at
        FROM api_keys
        WHERE key_hash = $1
          AND revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > now())
      `,
      values: [keyHash],
    });
    return result.rows[0] || null;
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'auth',
      message: 'Postgres query failed during API key validation',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    return null;
  }
}

export function hasScope(record: ApiKeyRecord, required: string): boolean {
  return record.scopes.includes(required);
}

export async function checkRateLimit(apiKeyId: string, limitPerMinute: number): Promise<RateLimitResult> {
  const minuteBucket = Math.floor(Date.now() / 60000);
  const key = `rate_limit:${apiKeyId}:${minuteBucket}`;
  const resetAt = (minuteBucket + 1) * 60000;

  try {
    const count = await shardB.incr(key);
    if (count === 1) {
      await shardB.expire(key, 120);
    }

    if (count > limitPerMinute) {
      return { allowed: false, remaining: 0, reset_at: resetAt };
    }
    return { allowed: true, remaining: limitPerMinute - count, reset_at: resetAt };
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      component: 'auth',
      message: 'Redis rate limit check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    return { allowed: true, remaining: -1, reset_at: 0 };
  }
}
