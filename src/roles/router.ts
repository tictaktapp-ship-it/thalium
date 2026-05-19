import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { shardC } from '../lib/redis';
import { LibrarianError } from '../lib/librarian-write';

const ModelSelectionSchema = z.object({
  provider: z.string(),
  model_id: z.string(),
  health_status: z.enum(['healthy', 'degraded', 'down'])
});

export interface ModelSelection extends z.infer<typeof ModelSelectionSchema> {}
export interface RouterResult {
  selected: ModelSelection;
  fallback_used: boolean;
  circuit_breaker_active: boolean;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function selectModel(intentType: string, domain: string): Promise<RouterResult> {
  try {
    const cacheKey = `model_registry:${intentType}:${domain}`;
    const cachedModels = await shardC.get(cacheKey);

    let models: ModelSelection[] = [];
    let fromCache = true;

    if (cachedModels) {
      try {
        models = z.array(ModelSelectionSchema).parse(cachedModels);
      } catch (error) {
        console.warn('Invalid cache data, falling back to database');
        fromCache = false;
      }
    } else {
      fromCache = false;
    }

    if (!fromCache) {
      const { data, error } = await supabase
        .from('model_registry')
        .select('provider, model_id, health_status')
        .eq('intent_type', intentType)
        .eq('domain', domain)
        .eq('health_status', 'healthy');

      if (error) throw error;
      if (!data) throw new LibrarianError('No models found in database', 'WRITE_FAILED');

      models = z.array(ModelSelectionSchema).parse(data);
      await shardC.set(cacheKey, JSON.stringify(models), { ex: 300 });
    }

    const blockedProviders = await getBlockedProviders();
    const availableModels = models.filter(model => 
      !blockedProviders.has(model.provider) && 
      model.health_status !== 'down'
    );

    let selectedModel: ModelSelection | undefined = undefined;
    let fallbackUsed = false;
    let circuitBreakerActive = false;

    if (availableModels.length > 0) {
      selectedModel = availableModels.find(m => m.health_status === 'healthy') || availableModels[0];
      fallbackUsed = selectedModel?.health_status !==  'healthy';
    } else {
      const degradedModels = models.filter(model => model.health_status === 'degraded');
      if (degradedModels.length > 0) {
        selectedModel = degradedModels[0];
        fallbackUsed = true;
        circuitBreakerActive = true;
      }
    }

    if (!selectedModel) {
      throw new LibrarianError('No available models', 'WRITE_FAILED');
    }

    return {
      selected: selectedModel,
      fallback_used: fallbackUsed,
      circuit_breaker_active: circuitBreakerActive
    };
  } catch (error) {
    if (error instanceof LibrarianError) throw error;
    throw new LibrarianError(`Model selection failed: ${error instanceof Error ? error.message : String(error)}`, 'WRITE_FAILED')
  }
}

async function getBlockedProviders(): Promise<Set<string>> {
  const keys = await shardC.keys('circuit_breaker:*');
  return new Set(keys.map(key => key.split(':')[1] ?? '').filter(Boolean));
}

export async function markCircuitBreaker(provider: string): Promise<void> {
  try {
    await shardC.set(`circuit_breaker:${provider}`, '1', { ex: 30 });
    console.warn(`Circuit breaker activated for provider: ${provider}`);
  } catch (error) {
    throw new LibrarianError(`Failed to mark circuit breaker: ${error instanceof Error ? error.message : String(error)}`, 'WRITE_FAILED');
  }
}

export async function clearCircuitBreaker(provider: string): Promise<void> {
  try {
    await shardC.del(`circuit_breaker:${provider}`);
  } catch (error) {
    throw new LibrarianError(`Failed to clear circuit breaker: ${error instanceof Error ? error.message : String(error)}`, 'WRITE_FAILED');
  }
}