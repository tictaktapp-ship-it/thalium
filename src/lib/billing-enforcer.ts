import { Pool } from 'pg';
import { Redis } from '@upstash/redis';
import { z } from 'zod';

// Initialize Postgres Pool
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Redis Shard A
const redisShardA = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_A_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_A_TOKEN!,
});

// Zod Schemas
const TokenUsageSchema = z.object({
  prompt_tokens: z.number().int().min(0),
  completion_tokens: z.number().int().min(0),
  total_tokens: z.number().int().min(0),
  cost_usd: z.number().min(0),
  model_provider: z.string().optional(),
  model_id: z.string().optional(),
});

const BillingCheckResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  current_count: z.number().int().min(0),
  limit: z.number().int().min(0),
  tier: z.string(),
});

// Types
export type TokenUsage = z.infer<typeof TokenUsageSchema>;
export type BillingCheckResult = z.infer<typeof BillingCheckResultSchema>;

// Constants
export const TIER_LIMITS: Record<string, number | undefined> = {
  neuron: 500,
  synapse: 5000,
  cortex: 50000,
  enterprise: Infinity,
};

const CACHE_TTL_SECONDS = 60;
const COMPONENT_NAME = 'billing-enforcer';

/**
 * Logs a structured JSON message to the console.
 * @param level The log level (e.g., 'info', 'warn', 'error').
 * @param message The main log message.
 * @param context An object containing additional context for the log.
 */
function log(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    component: COMPONENT_NAME,
    message,
    ...context,
  }));
}

/**
 * Checks if a brain instance is allowed to perform an invocation based on its billing tier and monthly limits.
 * Caches results in Redis for a short period to reduce database load.
 *
 * @param brainId The ID of the brain instance.
 * @returns A Promise that resolves to a BillingCheckResult object.
 */
export async function checkInvocationLimit(brainId: string): Promise<BillingCheckResult> {
  const cacheKey = `billing_check:${brainId}`;

  // Try to retrieve from Redis cache
  try {
    const rawCached = await redisShardA.get<string>(cacheKey);
    if (rawCached) {
      const cachedResult = BillingCheckResultSchema.parse(JSON.parse(rawCached));
      log('info', 'Cache hit for invocation limit check', { brainId, cachedResult });
      return cachedResult;
    }
  } catch (error) {
    log('warn', 'Redis cache read error for invocation limit check, falling back to Postgres', { brainId, error: String(error) });
    // Fall through to Postgres if Redis fails
  }

  // Query Postgres
  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query<{
        billing_tier: string;
        invocation_count: number;
        monthly_invocation_limit: number | null;
      }>(
        `SELECT billing_tier, invocation_count, monthly_invocation_limit FROM brain_instances WHERE id = $1`,
        [brainId]
      );

      if (result.rows.length === 0) {
        log('info', 'Brain not found for invocation limit check', { brainId });
        return { allowed: false, reason: 'brain_not_found', current_count: 0, limit: 0, tier: 'unknown' };
      }

      const row = result.rows[0]!;
      const { billing_tier, invocation_count, monthly_invocation_limit } = row;
      let limit: number;

      if (billing_tier === 'enterprise' || monthly_invocation_limit !== null) {
        limit = monthly_invocation_limit ?? Infinity;
      } else {
        limit = TIER_LIMITS[billing_tier] ?? 500;
      }

      const isAllowed = invocation_count < limit;
      const checkResult: BillingCheckResult = {
        allowed: isAllowed,
        reason: isAllowed ? undefined : 'monthly_limit_reached',
        current_count: invocation_count,
        limit: limit,
        tier: billing_tier,
      };

      // Cache the result in Redis
      try {
        await redisShardA.set(cacheKey, JSON.stringify(checkResult), { ex: CACHE_TTL_SECONDS });
        log('info', 'Cached invocation limit check result', { brainId, checkResult });
      } catch (redisError) {
        log('error', 'Failed to cache invocation limit check result in Redis', { brainId, checkResult, error: String(redisError) });
      }

      return checkResult;

    } finally {
      client.release();
    }
  } catch (error) {
    log('error', 'Postgres query error for invocation limit check', { brainId, error: String(error) });
    // Fail open on database errors
    return { allowed: true, reason: 'database_error_fail_open', current_count: 0, limit: 0, tier: 'unknown' };
  }
}

/**
 * Records an invocation for a brain instance, increments its count, and logs token usage.
 * Invalidates the Redis cache for the brain's billing status.
 * This function never throws.
 *
 * @param brainId The ID of the brain instance.
 * @param tokenUsage The token usage details for the invocation.
 * @returns A Promise that resolves when the operation is complete (or an error is logged).
 */
export async function recordInvocation(brainId: string, tokenUsage: TokenUsage): Promise<void> {
  const validatedTokenUsage = TokenUsageSchema.parse(tokenUsage); // Ensure tokenUsage conforms to schema

  let client;
  try {
    client = await pgPool.connect();
    await client.query('BEGIN');

    // Increment invocation_count
    await client.query(
      `UPDATE brain_instances SET invocation_count = invocation_count + 1, updated_at = NOW() WHERE id = $1`,
      [brainId]
    );

    // Insert into invocation_ledger
    await client.query(
      `INSERT INTO invocation_ledger (
        id, brain_id, chain_id, role_id, intent_type, model_provider, model_id,
        prompt_tokens, completion_tokens, total_tokens, cost_usd,
        error_message, error_code, created_at
      ) VALUES (
        gen_random_uuid(), $1, '', '', 'unknown', $2, $3,
        $4, $5, $6, $7,
        NULL, NULL, NOW()
      )`,
      [
        brainId,
        validatedTokenUsage.model_provider ?? 'unknown',
        validatedTokenUsage.model_id ?? 'unknown',
        validatedTokenUsage.prompt_tokens,
        validatedTokenUsage.completion_tokens,
        validatedTokenUsage.total_tokens,
        validatedTokenUsage.cost_usd,
      ]
    );

    await client.query('COMMIT');
    log('info', 'Invocation recorded successfully', { brainId, tokenUsage: validatedTokenUsage });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        log('error', 'Failed to rollback transaction after invocation record error', { brainId, error: String(error), rollbackError: String(rollbackError) });
      }
    }
    log('error', 'Failed to record invocation in Postgres', { brainId, tokenUsage: validatedTokenUsage, error: String(error) });
  } finally {
    if (client) {
      client.release();
    }
  }

  // Invalidate Redis cache, regardless of Postgres success/failure
  try {
    const cacheKey = `billing_check:${brainId}`;
    await redisShardA.del(cacheKey);
    log('info', 'Invalidated Redis cache for invocation limit', { brainId });
  } catch (error) {
    log('error', 'Failed to invalidate Redis cache after recording invocation', { brainId, error: String(error) });
  }
}




