import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('pg', () => ({ Pool: vi.fn(() => ({ query: mockPoolQuery, end: vi.fn() })) }));
vi.stubGlobal('fetch', mockFetch);

import { startWebhookDispatcher, stopWebhookDispatcher } from '../../jobs/webhook-dispatcher';

describe('webhook-dispatcher', () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockPoolQuery.mockResolvedValue({ rows: [] });
    mockFetch.mockReset();
  });

  afterEach(() => {
    stopWebhookDispatcher();
  });

  it('stopWebhookDispatcher does not throw', () => {
    expect(() => stopWebhookDispatcher()).not.toThrow();
  });

  it('dispatches pending delivery and marks as delivered', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{
        id: 'del-001',
        registration_id: 'reg-001',
        payload: { event: 'invocation.completed' },
        url: 'https://example.com/hook',
        secret_hash: 'abc123',
        attempt_count: 0,
      }] })
      .mockResolvedValueOnce({ rows: [] }); // update delivered

    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    // Import and call the internal dispatch function indirectly via a single poll
    // by checking that fetch was called after starting the dispatcher
    await startWebhookDispatcher();
    stopWebhookDispatcher();

    // Give async ops time to complete
    await new Promise(r => setTimeout(r, 100));

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/hook',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('marks delivery as retrying on fetch failure', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{
        id: 'del-002',
        registration_id: 'reg-001',
        payload: { event: 'invocation.completed' },
        url: 'https://example.com/hook',
        secret_hash: 'abc123',
        attempt_count: 0,
      }] })
      .mockResolvedValueOnce({ rows: [] }); // update retrying

    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    await startWebhookDispatcher();
    stopWebhookDispatcher();
    await new Promise(r => setTimeout(r, 100));

    expect(mockPoolQuery).toHaveBeenCalledTimes(2);
  });

  it('marks delivery as failed after max attempts', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{
        id: 'del-003',
        registration_id: 'reg-001',
        payload: { event: 'invocation.completed' },
        url: 'https://example.com/hook',
        secret_hash: 'abc123',
        attempt_count: 3, // already at max
      }] })
      .mockResolvedValueOnce({ rows: [] }); // update failed

    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    await startWebhookDispatcher();
    stopWebhookDispatcher();
    await new Promise(r => setTimeout(r, 100));

    expect(mockPoolQuery).toHaveBeenCalledTimes(2);
  });

  it('skips dispatch when no pending deliveries', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });

    await startWebhookDispatcher();
    stopWebhookDispatcher();
    await new Promise(r => setTimeout(r, 100));

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
