import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { handleChainInvocation } from './chain-executor';
import { handleChainInvocation } from './chain-executor';

declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
    }
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const shardC = new Redis({ url: process.env.REDIS_SHARD_C_URL!, token: process.env.REDIS_SHARD_C_TOKEN! });

const InvokeBodySchema = z.object({
  input: z.string().min(1),
  brain_id: z.string().min(1),
  domain: z.string().min(1),
  session_id: z.string().optional(),
});

const MemoryWriteBodySchema = z.object({
  address_key: z.string().regex(/^[a-z_]+\.[a-z_]+\.[a-z_]+\.[a-z_]+$/),
  content: z.record(z.unknown()),
  entry_level: z.string(),
  source: z.string().optional()
});

const CreateBrainBodySchema = z.object({
  name: z.string(),
  domain: z.string(),
  config: z.record(z.unknown()).optional()
});

export function requireInternalHeader(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['x-thalium-internal'];
  if (header !== process.env.X_THALIUM_INTERNAL) {
    res.status(401).json({ error: 'unauthorized', code: 'missing_internal_header' });
    return;
  }
  next();
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', code: 'missing_api_key' });
    return;
  }
  req.apiKey = authHeader.slice(7);
  next();
}

export function requireScope(scope: string): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.apiKey) {
        res.status(401).json({ error: 'unauthorized', code: 'missing_api_key' });
        return;
      }

      const { rows } = await pool.query(
        `SELECT scopes FROM api_keys 
         WHERE key_hash = encode(digest($1, 'sha256'), 'hex') 
         AND revoked_at IS NULL 
         AND (expires_at IS NULL OR expires_at > now())`,
        [req.apiKey]
      );

      const row = rows[0];
      if (!row || !row.scopes || !Array.isArray(row.scopes) || !row.scopes.includes(scope)) {
        res.status(403).json({ error: 'forbidden', code: 'insufficient_scope', required_scope: scope });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({ error: 'internal_error' });
    }
  };
}

export function createRouter(): Router {
  const router = Router();
  router.use(requireInternalHeader);
  router.use(requireApiKey);

  router.post('/v1/brain/:brainId/invoke', requireScope('invoke'), async (req, res) => {
    try {
      InvokeBodySchema.parse(req.body);
      await handleChainInvocation(req, res);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: 'invalid_input', detail: err.errors[0]?.message });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
    }
  });

  router.post('/v1/brain/:brainId/invoke/stream', requireScope('invoke'), async (req, res) => {
    try {
      InvokeBodySchema.parse(req.body);
      await handleChainInvocation(req, res);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: 'invalid_input', detail: err.errors[0]?.message });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
    }
  });

  router.get('/v1/brain/:brainId/memory', requireScope('memory:read'), (_req, res) => {
    res.status(200).json({ results: [], total: 0 });
  });

  router.post('/v1/brain/:brainId/memory/write', requireScope('memory:write'), async (req, res) => {
    try {
      MemoryWriteBodySchema.parse(req.body);
      res.status(202).json({ status: 'accepted' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: 'invalid_input', detail: err.errors[0]?.message });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
    }
  });

  router.delete('/v1/brain/:brainId/memory', requireScope('memory:admin'), (_req, res) => {
    res.status(202).json({ status: 'accepted' });
  });

  router.get('/v1/brain/:brainId/artifacts', requireScope('memory:read'), async (req, res) => {
    try {
      const brainId = String(req.params['brainId'] ?? '');
      const limit = Math.min(parseInt(String(req.query['limit'] ?? '20')), 100);
      const offset = parseInt(String(req.query['offset'] ?? '0'));
      const { rows } = await pool.query(
        `SELECT id, session_id, brain_id, status, address_key, confidence_score, gate_decision, created_at FROM artifacts WHERE brain_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [brainId, limit, offset]
      );
      const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int as total FROM artifacts WHERE brain_id = $1`, [brainId]);
      res.status(200).json({ artifacts: rows, total: countRows[0]?.total ?? 0 });
    } catch (err) { res.status(500).json({ error: 'internal_error' }); }
  });
  router.get('/v1/brain/:brainId/trace/:traceId', requireScope('audit:read'), (_req, res) => {
    res.status(200).json({ trace: null });
  });
  router.post('/v1/brain', requireScope('admin'), async (req, res) => {
    try {
      CreateBrainBodySchema.parse(req.body);
      res.status(202).json({ status: 'accepted' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: 'invalid_input', detail: err.errors[0]?.message });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
    }
  });

  router.put('/v1/brain/:brainId/config', requireScope('config:write'), (_req, res) => {
    res.status(200).json({ status: 'updated' });
  });

  router.get('/v1/brain/:brainId/usage', requireScope('invoke'), (_req, res) => {
    res.status(200).json({ usage: {} });
  });

  router.get('/v1/models', requireScope('invoke'), (_req, res) => {
    res.status(200).json({ models: [] });
  });

  router.post('/v1/brain/:brainId/seed', requireScope('admin'), async (req, res) => {
    try {
      const brainId = String(req.params['brainId'] ?? '');
      const rawDomain = req.body?.domain; const domain = typeof rawDomain === 'string' ? rawDomain : undefined;
      if (!domain) {
        res.status(400).json({ error: 'bad_request', code: 'missing_domain' });
        return;
      }
      const { seedBrainInstance } = await import('../lib/seeder');
      const result = await seedBrainInstance(brainId, domain);
      res.status(200).json(result);
    } catch (err) {
      console.error('Seed error:', err);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  router.get('/v1/brain/:brainId/status', requireScope('invoke'), async (req, res) => {
    try {
      const { brainId } = req.params;
      const cacheKey = 'brain_status:' + brainId;
      const cached = await shardC.get<string>(cacheKey);
      const parsed = cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
      if (parsed) {
        res.status(200).json(parsed);
        return;
      }
      const result = await pool.query('SELECT operational_state FROM brain_instances WHERE id = $1', [brainId]);
      const state = result.rows[0]?.operational_state ?? 'active';
      const response = { brain_id: brainId, operational_state: state, domain_uncertainty: false, active_chain_count: 0 };
      await shardC.set(cacheKey, JSON.stringify(response), { ex: 10 });
      res.status(200).json(response);
    } catch (err) {
      res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}
