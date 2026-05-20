import { Redis } from '@upstash/redis';
import { Pool } from 'pg';
import { z } from 'zod';


export type InterrogatorSensitivity = 'always' | 'calibrated' | 'silent';
export type DevilIntensity = 'light' | 'standard' | 'aggressive';
export type ScorerGateMode = 'strict' | 'standard' | 'lenient';
export type ConsolidationFrequency = 'aggressive' | 'standard' | 'conservative';
export type BoundaryKeeperPosture = 'permissive' | 'standard' | 'review_biased' | 'strict';
export type MemoryLength = 'short' | 'medium' | 'long' | 'permanent';
export type MemoryStyle = 'precise' | 'balanced' | 'expansive';

const DEFAULT_CONFIG = {
  interrogator_sensitivity: 'calibrated' as const,
  interrogator_threshold: 0.7,
  devil_intensity: 'standard' as const,
  devil_activation_map: {
    specification: true,
    change_request: true,
    diagnosis: true,
    verification: true,
    risk_assessment: true,
    retrospective: true,
    planning: true,
    knowledge_retrieval: false,
    compliance_check: true,
    knowledge_ingestion: true,
  },
  scorer_gate_mode: 'standard' as const,
  scorer_thresholds: {
    specification: 75,
    change_request: 80,
    diagnosis: 65,
    verification: 85,
    risk_assessment: 70,
    retrospective: 65,
    planning: 70,
    knowledge_retrieval: 60,
    compliance_check: 80,
    knowledge_ingestion: 70,
  },
  boundary_keeper_posture: 'standard' as const,
  chain_timeout_ms: 30000,
  consolidation_frequency: 'standard' as const,
  confidence_monitor_threshold: 65,
  memory_length: 'medium' as const,
  memory_style: 'balanced' as const,
};

const ChainConfigSchema = z.object({
  brain_id: z.string(),
  interrogator_sensitivity: z.enum(['always', 'calibrated', 'silent']),
  interrogator_threshold: z.number().min(0).max(1),
  devil_intensity: z.enum(['light', 'standard', 'aggressive']),
  devil_activation_map: z.record(z.string(), z.boolean()),
  scorer_gate_mode: z.enum(['strict', 'standard', 'lenient']),
  scorer_thresholds: z.record(z.string(), z.number()),
  boundary_keeper_posture: z.enum(['permissive', 'standard', 'review_biased', 'strict']),
  chain_timeout_ms: z.number().positive(),
  consolidation_frequency: z.enum(['aggressive', 'standard', 'conservative']),
  confidence_monitor_threshold: z.number().min(0).max(100),
  memory_length: z.enum(['short', 'medium', 'long', 'permanent']),
  memory_style: z.enum(['precise', 'balanced', 'expansive']),
}).partial();

export type ChainConfig = z.infer<typeof ChainConfigSchema> & { brain_id: string };

const shardA = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_A_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_A_TOKEN!,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function mergeWithDefaults(brainId: string, stored: Record<string, unknown>): ChainConfig {
  const parsed = ChainConfigSchema.safeParse(stored);
  const validStored = parsed.success ? parsed.data : {};
  return {
    ...DEFAULT_CONFIG,
    ...validStored,
    brain_id: brainId,
  };
}

async function getChainConfig(brainId: string): Promise<ChainConfig> {
  const cacheKey = `chain_config:${brainId}`;

  try {
    const raw = await shardA.get<string>(cacheKey);
    const cached = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (cached) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'chain-config',
        brain_id: brainId,
        message: 'Cache hit',
      }));
      return mergeWithDefaults(brainId, cached);
    }
  } catch (err) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      component: 'chain-config',
      brain_id: brainId,
      message: 'Redis read error',
      error: err instanceof Error ? err.message : String(err),
    }));
  }

  try {
    const { rows } = await pool.query<{ config: Record<string, unknown> }>(
      'SELECT config FROM brain_instances WHERE id = $1',
      [brainId]
    );

    if (rows.length === 0) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        component: 'chain-config',
        brain_id: brainId,
        message: 'No config found in database, using defaults',
      }));
      return mergeWithDefaults(brainId, {});
    }

    const merged = mergeWithDefaults(brainId, (rows[0]?.config as Record<string, unknown>) ?? {});

    try {
      await shardA.set(cacheKey, JSON.stringify(merged), { ex: 300 });
    } catch (err) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        component: 'chain-config',
        brain_id: brainId,
        message: 'Redis write-back error',
        error: err instanceof Error ? err.message : String(err),
      }));
    }

    return merged;
  } catch (err) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'chain-config',
      brain_id: brainId,
      message: 'Postgres error',
      error: err instanceof Error ? err.message : String(err),
    }));
    return mergeWithDefaults(brainId, {});
  }
}

async function invalidateChainConfigCache(brainId: string): Promise<void> {
  const cacheKey = `chain_config:${brainId}`;
  try {
    await shardA.del(cacheKey);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      component: 'chain-config',
      brain_id: brainId,
      message: 'Cache invalidated',
    }));
  } catch (err) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      component: 'chain-config',
      brain_id: brainId,
      message: 'Cache invalidation failed',
      error: err instanceof Error ? err.message : String(err),
    }));
  }
}

export { getChainConfig, invalidateChainConfigCache };
