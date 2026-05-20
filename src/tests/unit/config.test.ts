import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));

vi.mock('pg', () => ({ Pool: vi.fn(() => ({ query: mockPoolQuery, end: vi.fn() })) }));
vi.mock('../../api/routes', () => ({ requireScope: () => (_req: any, _res: any, next: any) => next() }));

import { createConfigRouter } from '../../api/config';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.set('pgPool', { query: mockPoolQuery, end: vi.fn() });
  app.use(createConfigRouter());
  return app;
}

describe('config', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockPoolQuery.mockResolvedValue({ rows: [] });
  });

  // PUT /config/memory
  it('returns 404 when brain not found for memory config', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] }); // getBrainConfig returns null

    const res = await request(buildApp())
      .put('/v1/brain/brain-001/config/memory')
      .send({ memory_length: 'long' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('brain_not_found');
  });

  it('updates memory config successfully', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ config: { memory_length: 'medium', memory_style: 'balanced' } }] })
      .mockResolvedValueOnce({ rows: [] }) // updateBrainConfig
      .mockResolvedValueOnce({ rows: [] }); // audit log

    const res = await request(buildApp())
      .put('/v1/brain/brain-001/config/memory')
      .send({ memory_length: 'long' });

    expect(res.status).toBe(200);
    expect(res.body.memory_length).toBe('long');
    expect(res.body.effective_from).toBe('next_calibrator_run');
  });

  it('returns 400 when no memory fields provided', async () => {
    const res = await request(buildApp())
      .put('/v1/brain/brain-001/config/memory')
      .send({});

    expect(res.status).toBe(400);
  });

  // PUT /config
  it('updates general config successfully', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ config: {} }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(buildApp())
      .put('/v1/brain/brain-001/config')
      .send({ devil_intensity: 'aggressive', boundary_keeper_posture: 'strict' });

    expect(res.status).toBe(200);
    expect(res.body.brain_id).toBe('brain-001');
    expect(res.body).toHaveProperty('effective_from');
  });

  // GET /config/history
  it('returns config history', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'log-001', event_type: 'config.updated', created_at: new Date().toISOString() }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = await request(buildApp())
      .get('/v1/brain/brain-001/config/history');

    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  // POST /config/preset/:presetName
  it('applies preset successfully', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ config: {} }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(buildApp())
      .post('/v1/brain/brain-001/config/preset/balanced');

    expect(res.status).toBe(200);
    expect(res.body.preset_applied).toBe('balanced');
    expect(res.body).toHaveProperty('config');
  });

  it('returns 400 for invalid preset name', async () => {
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/config/preset/nonexistent');

    expect(res.status).toBe(400);
  });
});
