import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));

vi.mock('pg', () => ({ Pool: vi.fn(() => ({ query: mockPoolQuery, end: vi.fn() })) }));
vi.mock('../../api/routes', () => ({ requireScope: () => (_req: any, _res: any, next: any) => next() }));

import { createWebhooksRouter } from '../../api/webhooks';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.set('pgPool', { query: mockPoolQuery, end: vi.fn() });
  app.use(createWebhooksRouter());
  return app;
}

describe('webhooks', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockPoolQuery.mockResolvedValue({ rows: [] });
  });

  it('POST /v1/webhooks creates webhook', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440001', brain_id: 'brain-001', url: 'https://example.com/hook', events: ['invocation.completed'], active: true }] });
    const res = await request(buildApp())
      .post('/v1/webhooks')
      .send({ brain_id: '550e8400-e29b-41d4-a716-446655440000', url: 'https://example.com/hook', events: ['invocation.completed'], secret: 'supersecretkey123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('webhook_id');
  });

  it('POST /v1/webhooks returns 400 for non-https url', async () => {
    const res = await request(buildApp())
      .post('/v1/webhooks')
      .send({ brain_id: '550e8400-e29b-41d4-a716-446655440000', url: 'http://example.com/hook', events: ['invocation.completed'], secret: 'supersecretkey123' });
    expect(res.status).toBe(400);
  });

  it('GET /v1/webhooks returns list', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440001', url: 'https://example.com', events: [], active: true }] });
    const res = await request(buildApp())
      .get('/v1/webhooks?brain_id=550e8400-e29b-41d4-a716-446655440000');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('webhooks');
  });

  it('DELETE /v1/webhooks/:id deactivates webhook', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp())
      .delete('/v1/webhooks/550e8400-e29b-41d4-a716-446655440001');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('deactivated');
  });

  it('GET /v1/webhooks/:id/deliveries returns deliveries', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 'd-001', event_type: 'invocation.completed', status: 'delivered' }] });
    const res = await request(buildApp())
      .get('/v1/webhooks/550e8400-e29b-41d4-a716-446655440001/deliveries');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('deliveries');
  });
});


