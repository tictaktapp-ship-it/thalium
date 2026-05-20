import { z } from 'zod';
import { LibrarianError } from '../lib/librarian-write';
import { shardA } from '../lib/redis';

export interface BrainInstanceConfig {
  subscriber_id: string;
  name: string;
  domain: string;
  region: 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'ap-southeast-1';
}

export interface BrainInstanceRecord {
  id: string;
  subscriber_id: string;
  name: string;
  domain: string;
  region: string;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

const BrainInstanceConfigSchema = z.object({
  subscriber_id: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  region: z.enum(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'])
});

export function validateBrainInstanceConfig(config: unknown): BrainInstanceConfig {
  const result = BrainInstanceConfigSchema.safeParse(config);
  if (!result.success) {
    throw new LibrarianError('Invalid Brain Instance config', 'VALIDATION_FAILED');
  }
  return result.data;
}

export async function createBrainInstance(config: BrainInstanceConfig): Promise<BrainInstanceRecord> {
  const brainInstance: BrainInstanceRecord = {
    id: crypto.randomUUID(),
    ...config,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/brain_instances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(brainInstance)
  });

  if (!response.ok) {
    throw new LibrarianError('Failed to create Brain Instance', 'WRITE_FAILED');
  }

  return brainInstance as BrainInstanceRecord;
}

export async function getBrainInstance(brainId: string): Promise<BrainInstanceRecord> {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/brain_instances?id=eq.${brainId}`, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
    }
  });

  if (!response.ok) {
    throw new LibrarianError('Brain Instance not found', 'VALIDATION_FAILED');
  }

  const jsonData = await response.json() as unknown[];
  if (!jsonData || jsonData.length === 0) {
    throw new LibrarianError('Brain Instance not found', 'VALIDATION_FAILED');
  }
  return jsonData[0] as BrainInstanceRecord;
}

export async function pauseBrainInstance(brainId: string): Promise<void> {
  const updateResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/brain_instances?id=eq.${brainId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
    },
    body: JSON.stringify({ status: 'paused', updated_at: new Date().toISOString() })
  });

  if (!updateResponse.ok) {
    throw new LibrarianError('Failed to pause Brain Instance', 'WRITE_FAILED');
  }

  const redisResponse = await shardA.set(`instance:${brainId}:pausing`, '1', { ex: 3600 });
  if (redisResponse !== 'OK') {
    throw new LibrarianError('Failed to pause Brain Instance', 'WRITE_FAILED');
  }
}