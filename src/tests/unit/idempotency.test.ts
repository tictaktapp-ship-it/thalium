import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockShardAGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockShardASet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({ get: mockShardAGet, set: mockShardASet })),
}));

import { idempotencyMiddleware, createIdempotencyKey } from '../../lib/idempotency';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(idempotencyMiddleware);
  app.post('/test', (_req, res) => res.status(200).json({ result: 'ok' }));
  return app;
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('idempotency', () => {
  beforeEach(() => {
    mockShardAGet.mockReset();
    mockShardASet.mockReset();
    mockShardAGet.mockResolvedValue(null);
    mockShardASet.mockResolvedValue('OK');
  });

  it('passes through when no Idempotency-Key header', async () => {
    const res = await request(buildApp())
      .post('/test')
      .set('Authorization', 'Bearer test-key')
      .send({});

    expect(res.status).toBe(200);
    expect(mockShardAGet).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid UUID format', async () => {
    const res = await request(buildApp())
      .post('/test')
      .set('Authorization', 'Bearer test-key')
      .set('Idempotency-Key', 'not-a-uuid')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalid_idempotency_key');
  });

  it('processes request and writes in_progress then complete to Redis', async () => {
    mockShardAGet.mockResolvedValueOnce(null); // no existing entry

    const res = await request(buildApp())
      .post('/test')
      .set('Authorization', 'Bearer test-key')
      .set('Idempotency-Key', VALID_UUID)
      .send({});

    expect(res.status).toBe(200);
    expect(mockShardASet).toHaveBeenCalledWith(
      expect.stringContaining('idempotency:'),
      expect.stringContaining('in_progress'),
      expect.objectContaining({ ex: 86400 })
    );
  });

  it('returns cached response on replay (complete status)', async () => {
    const cached = {
      status: 'complete',
      body: { result: 'cached' },
      status_code: 200,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };
    mockShardAGet.mockResolvedValueOnce(JSON.stringify(cached));

    const res = await request(buildApp())
      .post('/test')
      .set('Authorization', 'Bearer test-key')
      .set('Idempotency-Key', VALID_UUID)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('cached');
  });

  it('returns 409 when request is in_progress', async () => {
    const inProgress = {
      status: 'in_progress',
      created_at: new Date().toISOString(),
    };
    mockShardAGet.mockResolvedValueOnce(JSON.stringify(inProgress));

    const res = await request(buildApp())
      .post('/test')
      .set('Authorization', 'Bearer test-key')
      .set('Idempotency-Key', VALID_UUID)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('idempotency_conflict');
  });

  it('createIdempotencyKey returns correct format', () => {
    const key = createIdempotencyKey('abc123', 'my-uuid');
    expect(key).toBe('idempotency:abc123:my-uuid');
  });

  it('fails open on Redis error — processes request normally', async () => {
    mockShardAGet.mockRejectedValueOnce(new Error('Redis down'));

    const res = await request(buildApp())
      .post('/test')
      .set('Authorization', 'Bearer test-key')
      .set('Idempotency-Key', VALID_UUID)
      .send({});

    expect(res.status).toBe(200);
  });
});
