import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockShardBLpush = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({ lpush: mockShardBLpush })),
}));

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({ query: mockPoolQuery, end: vi.fn() })),
}));

import { writeAuditEvent, writeAuditEventDirect, buildAuditEvent, AUDIT_EVENTS } from '../../lib/audit-fallback';

describe('audit-fallback', () => {
  beforeEach(() => {
    mockShardBLpush.mockReset();
    mockPoolQuery.mockReset();
    mockShardBLpush.mockResolvedValue(1);
    mockPoolQuery.mockResolvedValue({ rows: [] });
  });

  describe('buildAuditEvent', () => {
    it('builds a valid AuditEvent with generated id and created_at', () => {
      const event = buildAuditEvent({
        brain_id: 'brain-001',
        event_type: AUDIT_EVENTS.INVOCATION_STARTED,
        actor_type: 'api_key',
        actor_id: 'key-001',
        payload: { session_id: 'sess-001' },
      });

      expect(event.id).toBeTruthy();
      expect(event.brain_id).toBe('brain-001');
      expect(event.event_type).toBe('invocation.started');
      expect(event.created_at).toBeTruthy();
    });

    it('uses provided id and created_at when given', () => {
      const event = buildAuditEvent({
        brain_id: 'brain-001',
        event_type: AUDIT_EVENTS.CALIBRATION_COMPLETE,
        actor_type: 'calibrator',
        actor_id: 'system',
        payload: {},
        id: 'fixed-id',
        created_at: '2026-01-01T00:00:00Z',
      });

      expect(event.id).toBe('fixed-id');
      expect(event.created_at).toBe('2026-01-01T00:00:00Z');
    });
  });

  describe('writeAuditEvent', () => {
    it('pushes to Redis Shard B on primary path', async () => {
      const event = buildAuditEvent({
        brain_id: 'brain-001', event_type: AUDIT_EVENTS.INVOCATION_COMPLETED,
        actor_type: 'system', actor_id: 'chain', payload: {},
      });

      await writeAuditEvent(event);

      expect(mockShardBLpush).toHaveBeenCalledWith('audit_queue', JSON.stringify(event));
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('falls back to Postgres when Redis Shard B fails', async () => {
      mockShardBLpush.mockRejectedValueOnce(new Error('Shard B down'));

      const event = buildAuditEvent({
        brain_id: 'brain-001', event_type: AUDIT_EVENTS.OUTCOME_RECORDED,
        actor_type: 'api_key', actor_id: 'key-001', payload: {},
      });

      await writeAuditEvent(event);

      expect(mockPoolQuery).toHaveBeenCalled();
    });

    it('never throws when both Redis and Postgres fail', async () => {
      mockShardBLpush.mockRejectedValueOnce(new Error('Redis down'));
      mockPoolQuery.mockRejectedValueOnce(new Error('DB down'));

      const event = buildAuditEvent({
        brain_id: 'brain-001', event_type: AUDIT_EVENTS.CONFIG_UPDATED,
        actor_type: 'api_key', actor_id: 'key-001', payload: {},
      });

      await expect(writeAuditEvent(event)).resolves.not.toThrow();
    });
  });

  describe('writeAuditEventDirect', () => {
    it('writes directly to Postgres bypassing Redis', async () => {
      const event = buildAuditEvent({
        brain_id: 'brain-001', event_type: AUDIT_EVENTS.BRAIN_CREATED,
        actor_type: 'system', actor_id: 'platform', payload: {},
      });

      await writeAuditEventDirect(event);

      expect(mockPoolQuery).toHaveBeenCalled();
      expect(mockShardBLpush).not.toHaveBeenCalled();
    });

    it('never throws on Postgres error', async () => {
      mockPoolQuery.mockRejectedValueOnce(new Error('DB down'));

      const event = buildAuditEvent({
        brain_id: 'brain-001', event_type: AUDIT_EVENTS.API_KEY_REVOKED,
        actor_type: 'system', actor_id: 'platform', payload: {},
      });

      await expect(writeAuditEventDirect(event)).resolves.not.toThrow();
    });
  });

  describe('AUDIT_EVENTS constants', () => {
    it('contains expected event types', () => {
      expect(AUDIT_EVENTS.INVOCATION_STARTED).toBe('invocation.started');
      expect(AUDIT_EVENTS.CALIBRATION_ROLLBACK).toBe('calibration.rollback');
      expect(AUDIT_EVENTS.RING_ENTRY_RECLASSIFIED).toBe('ring_entry.reclassified');
    });
  });
});
