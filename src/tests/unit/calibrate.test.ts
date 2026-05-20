import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../api/routes', () => ({
  requireScope: () => (_req: any, _res: any, next: any) => next(),
}));

import { createCalibrateRouter } from '../../api/calibrate';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(createCalibrateRouter());
  return app;
}

const validEntry = (id: string, confidence: number, daysAgo = 10) => ({
  id,
  address_key: 'specification.project.software.general',
  content: { text: 'test' },
  confidence,
  created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
});

describe('calibrate dry_run', () => {
  it('returns 400 when no entries provided', async () => {
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/calibrate/dry_run')
      .send({ entries: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 on missing entries field', async () => {
    const res = await request(buildApp())
      .post('/v1/brain/brain-001/calibrate/dry_run')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 200 with derived weights for valid entries', async () => {
    const entries = [
      validEntry('e1', 80),
      validEntry('e2', 75),
      validEntry('e3', 85),
    ];

    const res = await request(buildApp())
      .post('/v1/brain/brain-001/calibrate/dry_run')
      .send({ entries });

    expect(res.status).toBe(200);
    expect(res.body.dry_run).toBe(true);
    expect(res.body.brain_id).toBe('brain-001');
    expect(res.body.clusters).toHaveLength(1);
    expect(res.body.clusters[0].address_key).toBe('specification.project.software.general');
    expect(res.body.clusters[0]).toHaveProperty('derived_weights');
    const w = res.body.clusters[0].derived_weights;
    expect(w.architect_weight + w.devil_weight + w.coverage_weight).toBeCloseTo(1.0, 2);
  });

  it('groups entries by address_key into separate clusters', async () => {
    const entries = [
      validEntry('e1', 80),
      { ...validEntry('e2', 70), address_key: 'diagnosis.entity.software.defect' },
    ];

    const res = await request(buildApp())
      .post('/v1/brain/brain-001/calibrate/dry_run')
      .send({ entries });

    expect(res.status).toBe(200);
    expect(res.body.clusters).toHaveLength(2);
  });

  it('respects memory_length and memory_style params', async () => {
    const entries = [validEntry('e1', 80)];

    const res = await request(buildApp())
      .post('/v1/brain/brain-001/calibrate/dry_run')
      .send({ entries, memory_length: 'short', memory_style: 'precise' });

    expect(res.status).toBe(200);
    expect(res.body.memory_length).toBe('short');
    expect(res.body.memory_style).toBe('precise');
  });

  it('reports effective_entries_after_fade correctly', async () => {
    const recentEntry = validEntry('e1', 80, 10);
    const oldEntry = { ...validEntry('e2', 80, 400) }; // beyond 180-day medium window

    const res = await request(buildApp())
      .post('/v1/brain/brain-001/calibrate/dry_run')
      .send({ entries: [recentEntry, oldEntry], memory_length: 'medium', memory_style: 'balanced' });

    expect(res.status).toBe(200);
    expect(res.body.total_entries_submitted).toBe(2);
    expect(res.body.effective_entries_after_fade).toBe(1);
  });
});
