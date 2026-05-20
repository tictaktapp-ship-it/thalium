import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockLibrarianWrite = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'ring-entry-001' }));
const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));
const mockRedisGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockRedisSet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));

vi.mock('../../lib/librarian-write', () => ({ librarianWrite: mockLibrarianWrite }));
vi.mock('pg', () => ({ Pool: vi.fn(() => ({ query: mockPoolQuery, end: vi.fn() })) }));
vi.mock('@upstash/redis', () => ({ Redis: vi.fn(() => ({ get: mockRedisGet, set: mockRedisSet })) }));
vi.mock('../../api/routes', () => ({ requireScope: () => (_req: any, _res: any, next: any) => next() }));

import { createOutcomeRouter } from '../../api/outcome';

function buildApp() {
  const app = express();
  app.use(express.json());
  // Inject dependencies the handler reads from req.app
  app.set('pgPool', { query: mockPoolQuery, end: vi.fn() });
  app.set('redisShardC', { get: mockRedisGet, set: mockRedisSet });
  app.use(createOutcomeRouter());
  return app;
}

describe('outcome', () => {
  beforeEach(() => {
    mockLibrarianWrite.mockReset();
    mockPoolQuery.mockReset();
    mockRedisGet.mockReset();
    mockRedisSet.mockReset();
    mockLibrarianWrite.mockResolvedValue({ id: 'ring-entry-001' });
    mockPoolQuery.mockResolvedValue({ rows: [] });
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue('OK');
  });

  it('returns 404 when artifact not found', async () => {
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/artifacts/art-999/outcome')
      .send({ outcome_type: 'success', outcome_score: 85 });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('artifact_not_found');
  });

  it('records outcome successfully and returns 200', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'art-001', brain_id: 'brain-001', address_key: 'specification.project.software.general', anchor_id: 'anc-001' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(buildApp())
      .post('/v1/brain/brain-001/artifacts/art-001/outcome')
      .send({ outcome_type: 'success', outcome_score: 85, outcome_notes: 'Worked well' });

    expect(res.status).toBe(200);
    expect(res.body.artifact_id).toBe('art-001');
    expect(res.body.outcome_type).toBe('success');
    expect(res.body.ring_entry_id).toBe('ring-entry-001');
    expect(mockLibrarianWrite).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'outcome', entry_level: 'leaf' })
    );
  });

  it('flags reconsolidation for failure outcome', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'art-001', brain_id: 'brain-001', address_key: 'diagnosis.entity.software.defect', anchor_id: 'anc-001' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    const res = await request(app)
      .post('/v1/brain/brain-001/artifacts/art-001/outcome')
      .send({ outcome_type: 'failure', outcome_score: 20 });

    expect(res.status).toBe(200);
    expect(res.body.reconsolidation_flagged).toBe(true);
  });

  it('returns 400 on invalid body', async () => {
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/artifacts/art-001/outcome')
      .send({ bad: 'body' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('bad_request');
  });

  it('returns 400 when outcome_score is out of range', async () => {
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/artifacts/art-001/outcome')
      .send({ outcome_type: 'success', outcome_score: 150 });

    expect(res.status).toBe(400);
  });
});
