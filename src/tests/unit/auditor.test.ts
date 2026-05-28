import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockReadAnchor, mockWriteContribution, mockFetch } = vi.hoisted(() => ({
  mockReadAnchor: vi.fn(),
  mockWriteContribution: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('../../lib/anchor', () => ({
  readAnchor: mockReadAnchor,
  writeContribution: mockWriteContribution,
}));

vi.stubGlobal('fetch', mockFetch);

import { audit } from '../../roles/auditor';
import { LibrarianError } from '../../lib/librarian-write';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const brainId = '87654321-4321-4321-4321-210987654321';
const addressKey = 'specification.project.software.general';
const startedAt = new Date(Date.now() - 1000);

const validAnchor = {
  session_id: sessionId,
  brain_id: brainId,
  address_key: addressKey,
  created_at: new Date().toISOString(),
  last_refreshed_at: new Date().toISOString(),
  paused_at: null,
  pause_timeout_minutes: 10,
  contributions: [
    {
      role: 'triage',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: {}
    },
    {
      role: 'scorer',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: { confidence_score: 80, gate_decision: 'pass' }
    }
  ]
};

describe('auditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    mockWriteContribution.mockResolvedValue({ contributions: [] });
    mockReadAnchor.mockResolvedValue(validAnchor);
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it('returns AuditorResult with correct audit entry', async () => {
    const result = await audit(sessionId, brainId, addressKey, startedAt);
    expect(result.audit_entry.session_id).toBe(sessionId);
    expect(result.audit_entry.brain_id).toBe(brainId);
    expect(result.audit_entry.address_key).toBe(addressKey);
    expect(result.audit_entry.gate_decision).toBe('pass');
    expect(result.audit_entry.confidence_score).toBe(80);
    expect(result.audit_entry.duration_ms).toBeGreaterThan(0);
  });

  it('roles_activated contains all role names from anchor', async () => {
    const result = await audit(sessionId, brainId, addressKey, startedAt);
    expect(result.audit_entry.roles_activated).toContain('triage');
    expect(result.audit_entry.roles_activated).toContain('scorer');
  });

  it('writes audit entry to Supabase audit_log', async () => {
    await audit(sessionId, brainId, addressKey, startedAt);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('audit_log'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws WRITE_FAILED when Supabase write fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'Error' });
    try {
      await audit(sessionId, brainId, addressKey, startedAt);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LibrarianError);
      expect((err as LibrarianError).code).toBe('WRITE_FAILED');
    }
  });

  it('writes auditor contribution to anchor', async () => {
    await audit(sessionId, brainId, addressKey, startedAt);
    expect(mockWriteContribution).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ role: 'auditor', status: 'complete' })
    );
  });
});
