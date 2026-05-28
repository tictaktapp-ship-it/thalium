import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('pg', () => {
  const mockPool = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  };
  return { Pool: vi.fn(() => mockPool) };
});

vi.mock('@upstash/redis', () => {
  const mockRedis = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  };
  return { Redis: vi.fn(() => mockRedis) };
});

import { createRouter, requireInternalHeader, requireApiKey } from '../../api/routes';

const INTERNAL_SECRET = 'test-internal-secret';

function buildApp() {
  const app = express();
  app.use(express.json());
  process.env.THALIUM_INTERNAL_SECRET = INTERNAL_SECRET;
  app.use(createRouter());
  return app;
}

describe('routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.THALIUM_INTERNAL_SECRET = INTERNAL_SECRET;
  });

  it('rejects request missing X-Thalium-Internal header with 401', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/v1/brain/brain-001/invoke')
      .set('Authorization', 'Bearer test-key')
      .send({ session_id: 's1', entity_id: 'e1', input: { type: 'text', content: 'hello' } });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('missing_internal_header');
  });

  it('rejects request missing Authorization header with 401', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/v1/brain/brain-001/invoke')
      .set('X-Thalium-Internal', INTERNAL_SECRET)
      .send({ session_id: 's1', entity_id: 'e1', input: { type: 'text', content: 'hello' } });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('missing_api_key');
  });

  it('rejects invalid API key with 401', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const app = buildApp();
    const res = await request(app)
      .post('/v1/brain/brain-001/invoke')
      .set('X-Thalium-Internal', INTERNAL_SECRET)
      .set('Authorization', 'Bearer bad-key')
      .send({ session_id: 's1', entity_id: 'e1', input: { type: 'text', content: 'hello' } });

    expect([401, 403]).toContain(res.status);
  });

  it('rejects insufficient scope with 403', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValueOnce({ rows: [{ scopes: ['memory:read'] }] });

    const app = buildApp();
    const res = await request(app)
      .delete('/v1/brain/brain-001/memory')
      .set('X-Thalium-Internal', INTERNAL_SECRET)
      .set('Authorization', 'Bearer valid-key');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('insufficient_scope');
  });

  it('accepts valid invoke request with correct headers and scope', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValueOnce({ rows: [{ scopes: ['invoke'] }] });

    const app = buildApp();
    const res = await request(app)
      .post('/v1/brain/brain-001/invoke')
      .set('X-Thalium-Internal', INTERNAL_SECRET)
      .set('Authorization', 'Bearer valid-key')
      .send({ session_id: 's1', entity_id: 'e1', input: { type: 'text', content: 'hello' } });

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('accepted');
  });

  it('returns 400 on invalid invoke body', async () => {
    const { Pool } = await import('pg');
    const mockPool = new (Pool as any)();
    mockPool.query.mockResolvedValueOnce({ rows: [{ scopes: ['invoke'] }] });

    const app = buildApp();
    const res = await request(app)
      .post('/v1/brain/brain-001/invoke')
      .set('X-Thalium-Internal', INTERNAL_SECRET)
      .set('Authorization', 'Bearer valid-key')
      .send({ bad: 'body' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('bad_request');
  });
});
