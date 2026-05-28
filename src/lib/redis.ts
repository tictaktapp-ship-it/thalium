import { Redis } from '@upstash/redis';

export class RedisConfigError extends Error {
  constructor(public shard: 'A' | 'B' | 'C', message: string) {
    super(message);
    this.name = 'RedisConfigError';
  }
}

const createClient = (shard: 'A' | 'B' | 'C') => {
  const url = process.env[`REDIS_SHARD_${shard}_URL`];
  const token = process.env[`REDIS_SHARD_${shard}_TOKEN`];

  if (!url) {
    throw new RedisConfigError(shard, `Missing REDIS_SHARD_${shard}_URL environment variable`);
  }
  if (!token) {
    throw new RedisConfigError(shard, `Missing REDIS_SHARD_${shard}_TOKEN environment variable`);
  }

  return new Redis({
    url,
    token,
  });
};

export const shardA = createClient('A');
export const shardB = createClient('B');
export const shardC = createClient('C');

export const getShardName = (
  shard: typeof shardA | typeof shardB | typeof shardC
): 'A' | 'B' | 'C' => {
  if (shard === shardA) return 'A';
  if (shard === shardB) return 'B';
  return 'C';
};