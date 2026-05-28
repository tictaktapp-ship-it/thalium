import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockShardASet, mockFetch } = vi.hoisted(() => ({
  mockShardASet: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('../../lib/redis', () => ({
  shardA: { set: mockShardASet, get: vi.fn(), del: vi.fn() }
}));

vi.stubGlobal('fetch', mockFetch);

import { validateBrainInstanceConfig, createBrainInstance, getBrainInstance, pauseBrainInstance } from '../../api/instance-manager';
import { LibrarianError } from '../../lib/librarian-write';

const validConfig = {
  subscriber_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Brain',
  domain: 'software',
  region: 'eu-west-1' as const,
};

const validRecord = {
  id: '87654321-4321-4321-4321-210987654321',
  ...validConfig,
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('instance-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockShardASet.mockResolvedValue('OK');
  });

  describe('validateBrainInstanceConfig', () => {
    it('returns valid config for correct input', () => {
      const result = validateBrainInstanceConfig(validConfig);
      expect(result.name).toBe(validConfig.name);
      expect(result.domain).toBe(validConfig.domain);
      expect(result.region).toBe(validConfig.region);
    });

    it('throws VALIDATION_FAILED for invalid region', () => {
      try {
        validateBrainInstanceConfig({ ...validConfig, region: 'invalid-region' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
      }
    });

    it('throws VALIDATION_FAILED when name is empty', () => {
      try {
        validateBrainInstanceConfig({ ...validConfig, name: '' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('createBrainInstance', () => {
    it('returns created BrainInstanceRecord on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [validRecord]
      });
      const result = await createBrainInstance(validConfig);
      expect(result.name).toBe(validConfig.name);
      expect(result.status).toBe('active');
    });

    it('throws WRITE_FAILED when Supabase insert fails', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'Error' });
      try {
        await createBrainInstance(validConfig);
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('WRITE_FAILED');
      }
    });
  });

  describe('getBrainInstance', () => {
    it('returns BrainInstanceRecord when found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [validRecord]
      });
      const result = await getBrainInstance(validRecord.id);
      expect(result.id).toBe(validRecord.id);
    });

    it('throws VALIDATION_FAILED when not found', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
      try {
        await getBrainInstance('nonexistent-id');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('pauseBrainInstance', () => {
    it('sets pausing flag in Redis and updates Supabase', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [validRecord] });
      await pauseBrainInstance(validRecord.id);
      expect(mockShardASet).toHaveBeenCalledWith(
        expect.stringContaining('pausing'),
        '1',
        expect.anything()
      );
    });
  });
});
