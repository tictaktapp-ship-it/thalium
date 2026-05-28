import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));

vi.mock('pg', () => ({ Pool: vi.fn(() => ({ query: mockPoolQuery, end: vi.fn() })) }));
vi.mock('../../api/routes', () => ({ requireScope: () => (_req: any, _res: any, next: any) => next() }));

import { createMemoryOpsRouter } from '../../api/memory-ops';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.set('pgPool', { query: mockPoolQuery, connect: vi.fn().mockResolvedValue({ query: mockPoolQuery, release: vi.fn() }), end: vi.fn() });
  app.use(createMemoryOpsRouter());
  return app;
}

describe('memory-ops', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockPoolQuery.mockResolvedValue({ rows: [] });
  });

  it('reclassify returns 404 when artifact not found', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/artifacts/art-001/reclassify')
      .send({ intent_type: 'diagnosis', scope: 'entity', domain: 'software', specificity: 'general', rationale: 'Wrong type' });
    expect(res.status).toBe(404);
  });

  it('reclassify returns 200 on success', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'art-001', brain_id: 'brain-001', address_key: 'specification.project.software.general', anchor_id: 'anc-001' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/artifacts/art-001/reclassify')
      .send({ intent_type: 'diagnosis', scope: 'entity', domain: 'software', specificity: 'general', rationale: 'Wrong type' });
    expect(res.status).toBe(200);
    expect(res.body.new_address_key).toBe('diagnosis.entity.software.general');
  });

  it('search returns 400 when q is missing', async () => {
    const res = await request(buildApp())
      .get('/v1/brain/brain-001/memory/search');
    expect(res.status).toBe(400);
  });

  it('search returns results', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'e1', address_key: 'specification.project.software.general', content: {}, avg_confidence: 0.8, created_at: new Date().toISOString(), source: 'chain', anchor_id: 'anc-001' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(buildApp())
      .get('/v1/brain/brain-001/memory/search?q=payment');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(res.body).toHaveProperty('total');
  });

  it('move returns 404 when entry not found', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/memory/move')
      .send({ entry_id: '550e8400-e29b-41d4-a716-446655440000', new_address_key: 'diagnosis.entity.software.general' });
    expect(res.status).toBe(404);
  });

  it('contested returns list of contested entries', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'e1', address_key: 'diagnosis.entity.software.general', refiling_count: 3 }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(buildApp())
      .get('/v1/brain/brain-001/memory/contested');
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
  });

  it('resolve returns 404 when entry not found', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/memory/entry-001/resolve')
      .send({ action: 'approve' });
    expect(res.status).toBe(404);
  });

  it('resolve approve returns 200', async () => {
    const app = buildApp();
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'entry-001', brain_id: 'brain-001', address_key: 'diagnosis.entity.software.general', status: 'contested' }] }) // SELECT
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [] }) // audit INSERT
      .mockResolvedValueOnce({ rows: [] }); // COMMIT
    const res = await request(app)
      .post('/v1/brain/brain-001/memory/entry-001/resolve')
      .send({ action: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
  });
});





