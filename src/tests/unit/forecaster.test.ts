import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockShardAGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockShardASet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));
const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({ get: mockShardAGet, set: mockShardASet })),
}));

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({
    query: mockPoolQuery,
    connect: vi.fn().mockResolvedValue({
      query: mockPoolQuery,
      release: vi.fn(),
    }),
    end: vi.fn(),
  })),
}));

import { runForecaster, shouldActivate } from '../../roles/forecaster';
import type { AnchorState, RoleConfig } from '../../roles/forecaster';

describe('forecaster', () => {
  beforeEach(() => {
    mockShardAGet.mockReset();
    mockShardASet.mockReset();
    mockPoolQuery.mockReset();
    mockShardAGet.mockResolvedValue(null);
    mockShardASet.mockResolvedValue('OK');
    mockPoolQuery.mockResolvedValue({ rows: [] });
  });

  describe('shouldActivate', () => {
    it('returns true when forecaster in role_config.activate', () => {
      const anchor: AnchorState = { brain_id: 'b1' };
      const config: RoleConfig = { activate: ['forecaster'] };
      expect(shouldActivate(anchor, config)).toBe(true);
    });

    it('returns true when architect has null estimated_duration', () => {
      const anchor: AnchorState = { brain_id: 'b1', architect: { payload: { estimated_duration: null } } };
      const config: RoleConfig = {};
      expect(shouldActivate(anchor, config)).toBe(true);
    });

    it('returns true when architect has null estimated_effort', () => {
      const anchor: AnchorState = { brain_id: 'b1', architect: { payload: { estimated_effort: null } } };
      const config: RoleConfig = {};
      expect(shouldActivate(anchor, config)).toBe(true);
    });

    it('returns false when no activation signals', () => {
      const anchor: AnchorState = { brain_id: 'b1' };
      const config: RoleConfig = { activate: ['architect'] };
      expect(shouldActivate(anchor, config)).toBe(false);
    });
  });

  describe('runForecaster', () => {
    it('returns skipped when anchor not found in Redis', async () => {
      mockShardAGet.mockResolvedValueOnce(null);

      const result = await runForecaster('anc-001', 'brain-001', 'specification.project.software.general');

      expect(result.status).toBe('skipped');
      expect(result.role).toBe('forecaster');
    });

    it('returns insufficient_data with wide defaults when hist_count < 5', async () => {
      mockShardAGet.mockResolvedValueOnce(JSON.stringify({ brain_id: 'brain-001' }));
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ hist_confidence: null, hist_count: 2, avg_actual_days: null }] });

      const result = await runForecaster('anc-001', 'brain-001', 'specification.project.software.general');

      expect(result.status).toBe('insufficient_data');
      expect(result.payload?.timeline_estimate.likely_days).toBe(14);
      expect(result.payload?.calibration_note).toContain('Insufficient');
    });

    it('returns complete with calibrated estimates when hist_count >= 5', async () => {
      mockShardAGet.mockResolvedValueOnce(JSON.stringify({ brain_id: 'brain-001' }));
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ hist_confidence: 80, hist_count: 10, avg_actual_days: 20 }] });

      const result = await runForecaster('anc-001', 'brain-001', 'specification.project.software.general');

      expect(result.status).toBe('complete');
      expect(result.payload?.timeline_estimate.likely_days).toBe(20);
      expect(result.payload?.probability_estimate.success).toBeCloseTo(0.8, 1);
      expect(mockShardASet).toHaveBeenCalled();
    });

    it('never throws on Redis error — returns skipped', async () => {
      mockShardAGet.mockRejectedValueOnce(new Error('Shard A down'));

      const result = await runForecaster('anc-001', 'brain-001', 'specification.project.software.general');

      expect(result).toHaveProperty('role', 'forecaster');
      expect(result.status).toBe('skipped');
    });

    it('uses wide defaults on Postgres error', async () => {
      mockShardAGet.mockResolvedValueOnce(JSON.stringify({ brain_id: 'brain-001' }));
      mockPoolQuery.mockRejectedValueOnce(new Error('DB down'));

      const result = await runForecaster('anc-001', 'brain-001', 'specification.project.software.general');

      expect(result.status).toBe('insufficient_data');
    });
  });
});
