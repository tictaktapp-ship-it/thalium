import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThaliumSSEEmitter, isValidSSEEvent, createSSEResponse } from '../../sse/emitter';

const createMockRes = () => {
  const written: string[] = [];
  return {
    write: vi.fn((data: string) => { written.push(data); return true; }),
    end: vi.fn(),
    getWritten: () => written,
  };
};

describe('SSE emitter', () => {
  describe('isValidSSEEvent', () => {
    it('returns true for valid base events', () => {
      expect(isValidSSEEvent('fast.triage')).toBe(true);
      expect(isValidSSEEvent('fast.artifact')).toBe(true);
      expect(isValidSSEEvent('chain.partial')).toBe(true);
      expect(isValidSSEEvent('full.artifact')).toBe(true);
    });

    it('returns true for valid full.{role} events', () => {
      expect(isValidSSEEvent('full.architect')).toBe(true);
      expect(isValidSSEEvent('full.devil')).toBe(true);
      expect(isValidSSEEvent('full.librarian')).toBe(true);
    });

    it('returns false for invalid event names', () => {
      expect(isValidSSEEvent('invalid.event')).toBe(false);
      expect(isValidSSEEvent('full.unknownrole')).toBe(false);
      expect(isValidSSEEvent('')).toBe(false);
    });
  });

  describe('ThaliumSSEEmitter', () => {
    it('writes correctly formatted SSE event', () => {
      const res = createMockRes();
      const emitter = new ThaliumSSEEmitter(res);
      emitter.emit('fast.triage', { test: true });
      const written = res.getWritten().join('');
      expect(written).toContain('event: fast.triage');
      expect(written).toContain('data: {"test":true}');
      expect(written).toContain('id: 1');
    });

    it('increments event id on each emit', () => {
      const res = createMockRes();
      const emitter = new ThaliumSSEEmitter(res);
      emitter.emit('fast.triage', {});
      emitter.emit('fast.artifact', {});
      const written = res.getWritten().join('');
      expect(written).toContain('id: 1');
      expect(written).toContain('id: 2');
    });

    it('throws VALIDATION_FAILED for unknown event name', () => {
      const res = createMockRes();
      const emitter = new ThaliumSSEEmitter(res);
      try {
        emitter.emit('unknown.event', {});
        expect.fail('should have thrown');
      } catch (err) {
        expect((err as Error).name).toBe('LibrarianError');
      }
    });

    it('close calls res.end', () => {
      const res = createMockRes();
      const emitter = new ThaliumSSEEmitter(res);
      emitter.close();
      expect(res.end).toHaveBeenCalled();
    });

    it('does not write after close', () => {
      const res = createMockRes();
      const emitter = new ThaliumSSEEmitter(res);
      emitter.close();
      emitter.emit('fast.triage', {});
      expect(res.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('createSSEResponse', () => {
    it('returns a ThaliumSSEEmitter instance', () => {
      const res = createMockRes();
      const emitter = createSSEResponse(res);
      expect(emitter).toBeInstanceOf(ThaliumSSEEmitter);
    });
  });
});
