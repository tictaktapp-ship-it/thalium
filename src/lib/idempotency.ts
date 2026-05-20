import { Request, Response, NextFunction } from 'express';
import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

interface IdempotencyEntry {
  status: 'in_progress' | 'complete';
  created_at: string;
  artifact_id?: string;
  body?: unknown;
  status_code?: number;
  completed_at?: string;
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_KEY_PREFIX = 'idempotency:';
const TTL_SECONDS = 86400;

const shardA = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_A_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_A_TOKEN!
});

export function createIdempotencyKey(apiKeyHash: string, idempotencyKey: string): string {
  return IDEMPOTENCY_KEY_PREFIX + apiKeyHash + ':' + idempotencyKey;
}

function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.header('Idempotency-Key');
  if (!idempotencyKey) {
    return next();
  }

  if (!UUID_V4_REGEX.test(idempotencyKey)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      component: 'idempotency',
      message: 'Invalid idempotency key format',
      idempotencyKey
    }));
    return res.status(400).json({
      error: 'bad_request',
      code: 'invalid_idempotency_key'
    });
  }

  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const apiKey = authHeader.substring('Bearer '.length);
  const apiKeyHash = hashApiKey(apiKey);
  const redisKey = createIdempotencyKey(apiKeyHash, idempotencyKey);

  const handleRedisError = (operation: string, err: unknown) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      component: 'idempotency',
      message: `Redis ${operation} error`,
      error: err instanceof Error ? err.message : String(err),
      redisKey
    }));
  };

  const checkExistingEntry = async () => {
    try {
      const raw = await shardA.get<string>(redisKey);
      const entry = typeof raw === 'string' ? JSON.parse(raw) as IdempotencyEntry : raw;

      if (entry) {
        if (entry.status === 'complete') {
          res.setHeader('Content-Type', 'application/json');
          res.status(entry.status_code || 200).json(entry.body);
          return;
        }
        if (entry.status === 'in_progress') {
          res.status(409).json({
            error: 'conflict',
            code: 'idempotency_conflict',
            artifact_id: entry.artifact_id ?? null
          });
          return;
        }
      }

      const newEntry: IdempotencyEntry = {
        status: 'in_progress',
        created_at: new Date().toISOString()
      };

      await shardA.set(redisKey, JSON.stringify(newEntry), { ex: TTL_SECONDS });
      res.locals.idempotencyProcessed = true;
      res.locals.idempotencyKey = redisKey;
      next();
      return;
    } catch (err) {
      handleRedisError('read', err);
      next();
    }
  };

  const originalJson = res.json.bind(res);
  res.json = function(body: unknown): Response {
    const result: Response = originalJson(body);

    if (res.locals.idempotencyProcessed) {
      const updateEntry = async () => {
        try {
          const entry: IdempotencyEntry = {
            status: 'complete',
            created_at: res.locals.idempotencyEntry?.created_at || new Date().toISOString(),
            body,
            status_code: res.statusCode,
            completed_at: new Date().toISOString()
          };

          await shardA.set(res.locals.idempotencyKey, JSON.stringify(entry), { ex: TTL_SECONDS });
        } catch (err) {
          handleRedisError('write', err);
        }
      };

      updateEntry().catch(() => {});
    }

    return result;
  };

  checkExistingEntry().catch(() => next());
}