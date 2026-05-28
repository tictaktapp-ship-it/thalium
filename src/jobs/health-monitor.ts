import { Redis } from '@upstash/redis';
import { Pool } from 'pg';
import { setTimeout } from 'timers/promises';

type ProviderHealth = {
  provider: string;
  health_status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  last_checked_at: string;
};

type HealthCheckResult = {
  health_status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
};

const PROVIDERS = [
  { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/models' },
  { name: 'Anthropic', url: 'https://api.anthropic.com/v1/models' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1/models' }
] as const;

const shardC = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_C_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_C_TOKEN!
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

let isMonitoring = false;
let intervalId: NodeJS.Timeout | null = null;

async function checkProviderHealth(provider: string, url: string): Promise<HealthCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(5000, 'timeout').then(() => {
    controller.abort();
    return { health_status: 'down' as const, latency_ms: 5000 };
  });

  const start = Date.now();
  try {
    const response = await Promise.race([
      fetch(url, { signal: controller.signal }),
      timeout
    ]);

    if (response instanceof Response) {
      const latency_ms = Date.now() - start;
      if (response.ok) {
        return {
          health_status: (latency_ms > 3000 ? 'degraded' : 'healthy') as 'healthy' | 'degraded' | 'down',
          latency_ms
        };
      } else if (response.status === 429) {
        return { health_status: 'degraded' as const, latency_ms };
      } else {
        return { health_status: 'down' as const, latency_ms };
      }
    }
    return { health_status: 'down' as const, latency_ms: Date.now() - start };
  } catch (error) {
    return { health_status: 'down' as const, latency_ms: Date.now() - start };
  }
}

async function updateProviderStatus(provider: string, result: HealthCheckResult) {
  const now = new Date().toISOString();
  const status: ProviderHealth = {
    provider,
    health_status: result.health_status,
    latency_ms: result.latency_ms,
    last_checked_at: now
  };

  try {
    await shardC.set(`model_registry:${provider}`, JSON.stringify(status), { ex: 120 });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: now,
      level: 'ERROR',
      component: 'health-monitor',
      provider,
      message: 'Failed to update Redis cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
  }

  try {
    await pool.query(
      `INSERT INTO model_registry 
       (id, provider, health_status, latency_ms, last_checked_at, updated_at) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, now())
       ON CONFLICT (provider) 
       DO UPDATE SET 
         health_status = EXCLUDED.health_status,
         latency_ms = EXCLUDED.latency_ms,
         last_checked_at = EXCLUDED.last_checked_at,
         updated_at = now()`,
      [provider, status.health_status, status.latency_ms, status.last_checked_at]
    );
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: now,
      level: 'ERROR',
      component: 'health-monitor',
      provider,
      message: 'Failed to update Postgres',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
  }

  if (provider === 'OpenRouter' && result.health_status !== 'healthy') {
    try {
      await shardC.set('router:fallback', JSON.stringify({
        fallback_active: true,
        reason: `OpenRouter health status: ${result.health_status}`,
        set_at: now
      }));
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: now,
        level: 'ERROR',
        component: 'health-monitor',
        provider,
        message: 'Failed to set router fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  } else if (provider === 'OpenRouter' && result.health_status === 'healthy') {
    try {
      await shardC.del('router:fallback');
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: now,
        level: 'ERROR',
        component: 'health-monitor',
        provider,
        message: 'Failed to clear router fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}

async function checkAllProviders() {
  for (const provider of PROVIDERS) {
    try {
      const result = await checkProviderHealth(provider.name, provider.url);
      await updateProviderStatus(provider.name, result);
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        component: 'health-monitor',
        provider: provider.name,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}

export async function startHealthMonitor(): Promise<void> {
  if (isMonitoring) return;
  isMonitoring = true;

  await checkAllProviders();
  intervalId = setInterval(checkAllProviders, 60000);
}

export function stopHealthMonitor(): void {
  if (!isMonitoring) return;
  isMonitoring = false;

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function getProviderHealth(provider: string): Promise<ProviderHealth | null> {
  try {
    const cached = await shardC.get<string>(`model_registry:${provider}`);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached as unknown as ProviderHealth;

    const { rows } = await pool.query<ProviderHealth>(
      'SELECT provider, health_status, latency_ms, last_checked_at FROM model_registry WHERE provider = $1',
      [provider]
    );
    return rows[0] || null;
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component: 'health-monitor',
      provider,
      message: 'Failed to get provider health',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
    return null;
  }
}

