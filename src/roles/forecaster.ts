import { Redis } from '@upstash/redis';
import { Pool } from 'pg';
import { z } from 'zod';

const shardA = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_A_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_A_TOKEN!,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface ForecasterContribution {
  role: 'forecaster';
  status: 'complete' | 'skipped' | 'insufficient_data';
  written_at: string;
  payload: {
    timeline_estimate: { min_days: number; likely_days: number; max_days: number; confidence: number };
    effort_estimate: { min_points: number; likely_points: number; max_points: number; unit: string };
    probability_estimate: { success: number; on_time: number; within_scope: number };
    calibration_note: string;
  } | null;
}

export interface AnchorState {
  brain_id: string;
  architect?: { payload?: { estimated_duration?: unknown; estimated_effort?: unknown } };
  forecaster?: ForecasterContribution;
  [key: string]: unknown;
}

export interface RoleConfig {
  activate?: string[];
  [key: string]: unknown;
}

const HistoricalDataSchema = z.object({
  hist_confidence: z.number().nullable(),
  hist_count: z.number().nullable(),
  avg_actual_days: z.number().nullable(),
});

export function shouldActivate(anchorState: AnchorState, roleConfig: RoleConfig): boolean {
  return (
    roleConfig.activate?.includes('forecaster') ||
    anchorState.architect?.payload?.estimated_duration === null ||
    anchorState.architect?.payload?.estimated_effort === null
  );
}

export async function runForecaster(anchorId: string, brainId: string, addressKey: string): Promise<ForecasterContribution> {
  const contribution: ForecasterContribution = {
    role: 'forecaster',
    status: 'complete',
    written_at: new Date().toISOString(),
    payload: null,
  };

  try {
    const raw = await shardA.get<string>('anc_' + anchorId);
    const anchor = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (!anchor) {
      contribution.status = 'skipped';
      return contribution;
    }

    const client = await pool.connect();
    try {
      const res = await client.query<typeof HistoricalDataSchema>(
        `SELECT AVG(avg_confidence) as hist_confidence, COUNT(*) as hist_count,
         AVG((content->>'estimated_days_actual')::numeric) as avg_actual_days
         FROM institutional_ring
         WHERE brain_id = $1 AND address_key <@ $2::ltree
         AND superseded_by IS NULL AND source = 'outcome'
         LIMIT 50`,
        [brainId, addressKey]
      );

      const historicalData = HistoricalDataSchema.parse(res.rows[0]);
      const histCount = historicalData.hist_count ?? 0;
      const avgActualDays = historicalData.avg_actual_days ?? 14;
      const histConfidence = historicalData.hist_confidence ?? 65;

      let timelineEstimate: { min_days: number; likely_days: number; max_days: number; confidence: number };
      let calibrationNote = '';

      if (histCount >= 5) {
        timelineEstimate = {
          min_days: Math.round(avgActualDays * 0.7),
          likely_days: Math.round(avgActualDays),
          max_days: Math.round(avgActualDays * 1.3),
          confidence: Math.min(histCount / 20, 0.9),
        };
        calibrationNote = `Estimates calibrated using ${histCount} historical outcomes`;
      } else {
        timelineEstimate = {
          min_days: 3,
          likely_days: 14,
          max_days: 60,
          confidence: 0.5,
        };
        calibrationNote = 'Insufficient historical data — estimates are wide defaults';
        contribution.status = 'insufficient_data';
      }

      const effortEstimate = {
        min_points: Math.round(timelineEstimate.min_days * 2),
        likely_points: Math.round(timelineEstimate.likely_days * 2),
        max_points: Math.round(timelineEstimate.max_days * 2),
        unit: 'story_points',
      };

      const probabilityEstimate = {
        success: histConfidence / 100,
        on_time: (histConfidence / 100) * 0.8,
        within_scope: 0.75,
      };

      contribution.payload = {
        timeline_estimate: timelineEstimate,
        effort_estimate: effortEstimate,
        probability_estimate: probabilityEstimate,
        calibration_note: calibrationNote,
      };

      const updatedAnchor = { ...anchor, forecaster: contribution };
      await shardA.set('anc_' + anchorId, JSON.stringify(updatedAnchor), { keepTtl: true });
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        component: 'forecaster',
        brain_id: brainId,
        message: 'Postgres query failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      contribution.status = 'insufficient_data';
    } finally {
      client.release();
    }
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      component: 'forecaster',
      brain_id: brainId,
      message: 'Redis read/write failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    contribution.status = 'skipped';
  }

  return contribution;
}