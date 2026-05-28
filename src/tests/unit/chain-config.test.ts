import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockShardAGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockShardASet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));
const mockShardADel = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockPoolQuery = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({ get: mockShardAGet, set: mockShardASet, del: mockShardADel })),
}));

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({ query: mockPoolQuery, end: vi.fn() })),
}));

import { getChainConfig, invalidateChainConfigCache } from '../../lib/chain-config';

describe('chain-config', () => {
  beforeEach(() => {
    mockShardAGet.mockReset();
    mockShardASet.mockReset();
    mockShardADel.mockReset();
    mockPoolQuery.mockReset();
    mockShardAGet.mockResolvedValue(null);
    mockShardASet.mockResolvedValue('OK');
    mockShardADel.mockResolvedValue(1);
    mockPoolQuery.mockResolvedValue({ rows: [] });
  });

  it('returns default config when brain not found in DB', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });

    const config = await getChainConfig('brain-001');

    expect(config.brain_id).toBe('brain-001');
    expect(config.interrogator_sensitivity).toBe('calibrated');
    expect(config.devil_intensity).toBe('standard');
    expect(config.chain_timeout_ms).toBe(30000);
  });

  it('returns cached config from Shard A on cache hit', async () => {
    const cached = {
      brain_id: 'brain-001',
      interrogator_sensitivity: 'always',
      devil_intensity: 'aggressive',
      scorer_gate_mode: 'strict',
      boundary_keeper_posture: 'strict',
      chain_timeout_ms: 30000,
      interrogator_threshold: 0.7,
      devil_activation_map: {},
      scorer_thresholds: {},
      consolidation_frequency: 'standard',
      confidence_monitor_threshold: 65,
      memory_length: 'medium',
      memory_style: 'balanced',
    };
    mockShardAGet.mockResolvedValueOnce(JSON.stringify(cached));

    const config = await getChainConfig('brain-001');

    expect(config.interrogator_sensitivity).toBe('always');
    expect(mockPoolQuery).not.toHaveBeenCalled();
  });

  it('merges stored config with defaults from Postgres', async () => {
    mockShardAGet.mockResolvedValueOnce(null);
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ config: { devil_intensity: 'aggressive', scorer_gate_mode: 'strict' } }],
    });

    const config = await getChainConfig('brain-001');

    expect(config.devil_intensity).toBe('aggressive');
    expect(config.scorer_gate_mode).toBe('strict');
    expect(config.interrogator_sensitivity).toBe('calibrated'); // default preserved
    expect(mockShardASet).toHaveBeenCalled(); // written back to cache
  });

  it('falls back to defaults on Redis error', async () => {
    mockShardAGet.mockRejectedValueOnce(new Error('Shard A down'));
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ config: { devil_intensity: 'light' } }],
    });

    const config = await getChainConfig('brain-001');

    expect(config.devil_intensity).toBe('light');
  });

  it('never throws — returns default config on total failure', async () => {
    mockShardAGet.mockRejectedValueOnce(new Error('Redis down'));
    mockPoolQuery.mockRejectedValueOnce(new Error('DB down'));

    const config = await getChainConfig('brain-999');

    expect(config).toHaveProperty('brain_id', 'brain-999');
    expect(config).toHaveProperty('chain_timeout_ms');
  });

  it('invalidateChainConfigCache deletes Shard A key', async () => {
    await invalidateChainConfigCache('brain-001');
    expect(mockShardADel).toHaveBeenCalledWith('chain_config:brain-001');
  });
});
