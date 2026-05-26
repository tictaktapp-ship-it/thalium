import { Pool } from 'pg';
import { Redis } from '@upstash/redis';
import { z } from 'zod';


const log = (level: 'info' | 'error' | 'warn', message: string, context?: Record<string, unknown>) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    component: 'billing-enforcer',
    message,
    ...context
  }));
};

const redisShardA = new Redis({
  url: process.env.REDIS_SHARD_A_URL!,
  token: process.env.REDIS_SHARD_A_TOKEN!,
});

const redisShardC = new Redis({
  url: process.env.REDIS_SHARD_C_URL!,
  token: process.env.REDIS_SHARD_C_TOKEN!,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  plan: z.enum(['spark', 'neuron', 'lobe', 'studio', 'enterprise']),
  status: z.string(),
  invocation_limit: z.number().nullable(),
  overage_enabled: z.boolean(),
});

type Subscription = z.infer<typeof SubscriptionSchema>;

export type InvocationCheckResult = {
  allowed: boolean;
  reason?: 'allocation_exhausted' | 'error_fail_open';
  is_overage?: boolean;
  current_count: number;
  limit?: number | null;
};

const PLAN_LIMITS: Record<string, number | null> = {
  spark: 500,
  neuron: 3500,
  lobe: 30000,
  studio: 100000,
  enterprise: null,
};

async function getActiveSubscription(orgId: string): Promise<Subscription | null> {
  try {
    const cached = await redisShardC.get(`sub_cache:${orgId}`);
    if (cached) {
      return SubscriptionSchema.parse(cached);
    }

    const { rows } = await pool.query<Subscription>(`
      SELECT * FROM subscriptions 
      WHERE org_id = $1 AND status IN ('active','trialing')
      ORDER BY created_at DESC LIMIT 1
    `, [orgId]);

    if (rows.length > 0) {
      const subscription = SubscriptionSchema.parse(rows[0]);
      await redisShardC.set(`sub_cache:${orgId}`, subscription, { ex: 300 });
      return subscription;
    }

    return null;
  } catch (error) {
    log('error', 'Failed to fetch subscription', { orgId, error });
    return null;
  }
}

export async function checkAndIncrementInvocation(brainId: string, orgId: string): Promise<InvocationCheckResult> {
  const now = new Date(); const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const usageKey = `usage:${brainId}:${currentMonth}`;

  try {
    const subscription = await getActiveSubscription(orgId);
    if (!subscription) {
      return { allowed: true, reason: 'error_fail_open', current_count: 0 };
    }

    const limit = subscription.invocation_limit ?? PLAN_LIMITS[subscription.plan] ?? null;
    const currentCount = await redisShardA.get<number>(usageKey) ?? 0;

    if (limit !== null && currentCount >= limit) {
      if (!subscription.overage_enabled) {
        return {
          allowed: false,
          reason: 'allocation_exhausted',
          current_count: currentCount,
          limit,
        };
      }
      
      await redisShardA.incr(usageKey);
      return {
        allowed: true,
        is_overage: true,
        current_count: currentCount + 1,
        limit,
      };
    }

    await redisShardA.incr(usageKey);
    return {
      allowed: true,
      is_overage: false,
      current_count: currentCount + 1,
      limit,
    };
  } catch (error) {
    log('error', 'Failed to check and increment invocation', { brainId, orgId, error });
    return { allowed: true, reason: 'error_fail_open', current_count: 0 };
  }
}

export async function recordInvocationLedger(params: {
  brainId: string;
  orgId: string;
  invocationId: string;
  isOverage: boolean;
  modelCostGbp?: number;
}): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO invocation_ledger 
      (id, brain_id, org_id, invocation_id, occurred_at, is_overage, model_cost_estimate_gbp)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4, $5)
    `, [params.brainId, params.orgId, params.invocationId, params.isOverage, params.modelCostGbp]);
  } catch (error) {
    log('error', 'Failed to record invocation ledger', { params, error });
  }
}

export async function invalidateSubscriptionCache(orgId: string): Promise<void> {
  try {
    await redisShardC.del(`sub_cache:${orgId}`);
  } catch (error) {
    log('error', 'Failed to invalidate subscription cache', { orgId, error });
  }
}
