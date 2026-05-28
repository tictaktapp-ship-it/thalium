import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { requireScope } from './routes';

const memoryConfigSchema = z.object({
  memory_length: z.enum(['short', 'medium', 'long', 'permanent']).optional(),
  memory_style: z.enum(['precise', 'balanced', 'expansive']).optional()
}).refine(data => data.memory_length !== undefined || data.memory_style !== undefined, {
  message: 'no_fields_provided',
  path: ['error']
});

const generalConfigSchema = z.object({
  interrogator_sensitivity: z.enum(['always', 'calibrated', 'silent']).optional(),
  devil_intensity: z.enum(['light', 'standard', 'aggressive']).optional(),
  scorer_gate_mode: z.enum(['strict', 'standard', 'lenient']).optional(),
  consolidation_frequency: z.enum(['aggressive', 'standard', 'conservative']).optional(),
  confidence_monitor_threshold: z.number().min(40).max(95).optional(),
  boundary_keeper_posture: z.enum(['permissive', 'standard', 'review_biased', 'strict']).optional()
}).passthrough();

const presetSchema = z.enum(['conservative', 'balanced', 'aggressive', 'silent', 'audit_mode']);

const historyQuerySchema = z.object({ limit: z.coerce.number().min(1).max(50).default(20), offset: z.coerce.number().min(0).default(0) });

const presets = {
  conservative: {
    interrogator_sensitivity: 'always',
    devil_intensity: 'aggressive',
    scorer_gate_mode: 'strict',
    boundary_keeper_posture: 'strict',
    consolidation_frequency: 'conservative'
  },
  balanced: {
    interrogator_sensitivity: 'calibrated',
    devil_intensity: 'standard',
    scorer_gate_mode: 'standard',
    boundary_keeper_posture: 'standard',
    consolidation_frequency: 'standard'
  },
  aggressive: {
    interrogator_sensitivity: 'silent',
    devil_intensity: 'light',
    scorer_gate_mode: 'lenient',
    boundary_keeper_posture: 'permissive',
    consolidation_frequency: 'aggressive'
  },
  silent: {
    interrogator_sensitivity: 'silent',
    devil_intensity: 'light',
    scorer_gate_mode: 'lenient',
    boundary_keeper_posture: 'permissive',
    consolidation_frequency: 'conservative'
  },
  audit_mode: {
    interrogator_sensitivity: 'always',
    devil_intensity: 'aggressive',
    scorer_gate_mode: 'strict',
    boundary_keeper_posture: 'review_biased',
    consolidation_frequency: 'conservative'
  }
} as const;

async function getBrainConfig(pool: Pool, brainId: string): Promise<Record<string, unknown> | null> {
  const { rows } = await pool.query('SELECT config FROM brain_instances WHERE id = $1', [brainId]);
  return rows[0]?.config ?? null;
}

async function updateBrainConfig(pool: Pool, brainId: string, config: Record<string, unknown>): Promise<void> {
  await pool.query('UPDATE brain_instances SET config = $1, updated_at = now() WHERE id = $2', [config, brainId]);
}

async function writeConfigAuditLog(pool: Pool, brainId: string, actorId: string, eventType: string, payload: unknown): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO audit_log (id, brain_id, event_type, actor_type, actor_id, payload, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())',
      [brainId, eventType, 'api_key', actorId, payload]
    );
  } catch (error) {
    console.error('Failed to write config audit log', { error });
  }
}

export function createConfigRouter(): Router {
  const router = Router();

  router.put('/v1/brain/:brainId/config/memory', requireScope('config:write'), async (req: Request, res: Response) => {
    try {
      const pool = req.app.get('pgPool') as Pool;
      const brainId = req.params['brainId'] as string;
      const body = memoryConfigSchema.parse(req.body);

      const currentConfig = await getBrainConfig(pool, brainId);
      if (!currentConfig) {
        res.status(404).json({ error: 'not_found', code: 'brain_not_found' });
        return;
      }

      const updatedConfig = { ...(currentConfig ?? {}), ...body };
      await updateBrainConfig(pool, brainId, updatedConfig);
      await writeConfigAuditLog(pool, brainId, req.apiKey ?? 'unknown', 'config.memory_updated', body);

      res.json({
        brain_id: brainId,
        memory_length: updatedConfig.memory_length,
        memory_style: updatedConfig.memory_style,
        effective_from: 'next_calibrator_run'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: error.errors[0]?.message ?? 'invalid input' });
      }
      console.error('Memory config update failed', { error });
      res.status(500).json({ error: 'internal_error', code: 'memory_config_update_failed' });
    }
  });

  router.put('/v1/brain/:brainId/config', requireScope('config:write'), async (req: Request, res: Response) => {
    try {
      const pool = req.app.get('pgPool') as Pool;
      const brainId = req.params['brainId'] as string;
      const body = generalConfigSchema.parse(req.body);

      const currentConfig = await getBrainConfig(pool, brainId);
      if (!currentConfig) {
        res.status(404).json({ error: 'not_found', code: 'brain_not_found' });
        return;
      }

      const updatedConfig = { ...(currentConfig ?? {}), ...body };
      await updateBrainConfig(pool, brainId, updatedConfig);
      await writeConfigAuditLog(pool, brainId, req.apiKey ?? 'unknown', 'config.updated', body);

      const immediateFields = ['boundary_keeper_posture', 'confidence_monitor_threshold']
        .filter(field => field in body);
      const nextRunFields = [
        'interrogator_sensitivity', 'devil_intensity', 'scorer_gate_mode',
        'consolidation_frequency', 'memory_length', 'memory_style'
      ].filter(field => field in body);

      res.json({
        brain_id: brainId,
        config: updatedConfig,
        effective_from: {
          immediate: immediateFields,
          next_calibrator_run: nextRunFields
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: error.errors[0]?.message ?? 'invalid input' });
      }
      console.error('General config update failed', { error });
      res.status(500).json({ error: 'internal_error', code: 'general_config_update_failed' });
    }
  });

  router.get('/v1/brain/:brainId/config/history', requireScope('config:read'), async (req: Request, res: Response) => {
    try {
      const pool = req.app.get('pgPool') as Pool;
      const brainId = req.params['brainId'] as string;
      const { limit, offset } = historyQuerySchema.parse(req.query);

      const historyQuery = await pool.query(
        'SELECT id, brain_id, event_type, actor_type, actor_id, payload, created_at FROM audit_log WHERE brain_id = $1 AND event_type LIKE $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
        [brainId, 'config.%', limit, offset]
      );

      const totalQuery = await pool.query(
        'SELECT COUNT(*) FROM audit_log WHERE brain_id = $1 AND event_type LIKE $2',
        [brainId, 'config.%']
      );

      res.json({
        brain_id: brainId,
        history: historyQuery.rows,
        total: parseInt(totalQuery.rows[0].count, 10),
        limit,
        offset
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: error.errors[0]?.message ?? 'invalid input' });
      }
      console.error('Config history fetch failed', { error });
      res.status(500).json({ error: 'internal_error', code: 'config_history_fetch_failed' });
    }
  });

  router.post('/v1/brain/:brainId/config/preset/:presetName', requireScope('config:write'), async (req: Request, res: Response) => {
    try {
      const pool = req.app.get('pgPool') as Pool;
      const brainId = req.params['brainId'] as string;
      const presetName = req.params['presetName'] as string;
      const preset = presetSchema.parse(presetName);

      const currentConfig = await getBrainConfig(pool, brainId);
      if (!currentConfig) {
        res.status(404).json({ error: 'not_found', code: 'brain_not_found' });
        return;
      }

      const presetConfig = presets[preset];
      const updatedConfig = { ...currentConfig, ...presetConfig };
      await updateBrainConfig(pool, brainId, updatedConfig);
      await writeConfigAuditLog(pool, brainId, req.apiKey ?? 'unknown', 'config.preset_applied', { preset, config: presetConfig });

      res.json({
        brain_id: brainId,
        preset_applied: preset,
        config: updatedConfig,
        effective_from: 'next_calibrator_run'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: error.errors[0]?.message ?? 'invalid input' });
      }
      console.error('Preset config update failed', { error });
      res.status(500).json({ error: 'internal_error', code: 'preset_config_update_failed' });
    }
  });

  return router;
}