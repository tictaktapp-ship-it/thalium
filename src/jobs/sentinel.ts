import { Pool } from 'pg';
import { z } from 'zod';

const SentinelAnomalySchema = z.object({
  type: z.union([
    z.literal('confidence_drift'),
    z.literal('velocity_spike'),
    z.literal('coverage_gap')
  ]),
  address_key: z.string(),
  detail: z.string(),
  severity: z.union([z.literal('warn'), z.literal('critical')])
});

const SentinelReportSchema = z.object({
  brain_id: z.string(),
  checked_at: z.string(),
  anomalies: z.array(SentinelAnomalySchema),
  duration_ms: z.number()
});

type SentinelAnomaly = z.infer<typeof SentinelAnomalySchema>;
type SentinelReport = z.infer<typeof SentinelReportSchema>;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

async function checkConfidenceDrift(brainId: string): Promise<SentinelAnomaly[]> {
  try {
    const query = `
      SELECT address_key::text, AVG(avg_confidence) as region_avg
      FROM institutional_ring
      WHERE brain_id = $1 AND superseded_by IS NULL AND created_at > now() - interval '1 hour'
      GROUP BY address_key
      HAVING AVG(avg_confidence) < (
        SELECT AVG(avg_confidence) - 15 FROM institutional_ring WHERE brain_id = $1 AND superseded_by IS NULL
      )
    `;
    const result = await pool.query(query, [brainId]);
    return result.rows.map(row => ({
      type: 'confidence_drift',
      address_key: row.address_key,
      detail: `Region confidence dropped below baseline: ${row.region_avg}`,
      severity: 'warn'
    }));
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'sentinel',
      brain_id: brainId,
      message: 'Confidence drift check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
    return [{
      type: 'confidence_drift',
      address_key: 'unknown',
      detail: error instanceof Error ? error.message : 'Unknown error',
      severity: 'warn'
    }];
  }
}

async function checkVelocitySpike(brainId: string): Promise<SentinelAnomaly[]> {
  try {
    const query = `
      SELECT split_part(address_key::text, '.', 1) || '.' || split_part(address_key::text, '.', 2) || '.' || split_part(address_key::text, '.', 3) as prefix,
      COUNT(*) as entry_count
      FROM institutional_ring
      WHERE brain_id = $1 AND created_at > now() - interval '10 minutes'
      GROUP BY prefix
      HAVING COUNT(*) > 200
    `;
    const result = await pool.query(query, [brainId]);
    return result.rows.map(row => ({
      type: 'velocity_spike',
      address_key: row.prefix,
      detail: `Entry velocity spike detected: ${row.entry_count} entries`,
      severity: 'critical'
    }));
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'sentinel',
      brain_id: brainId,
      message: 'Velocity spike check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
    return [{
      type: 'velocity_spike',
      address_key: 'unknown',
      detail: error instanceof Error ? error.message : 'Unknown error',
      severity: 'critical'
    }];
  }
}

async function checkCoverageGap(brainId: string): Promise<SentinelAnomaly[]> {
  try {
    const query = `
      SELECT cm.address_key::text
      FROM coverage_map cm
      WHERE cm.brain_id = $1 AND cm.entry_count > 0
      AND NOT EXISTS (
        SELECT 1 FROM institutional_ring ir
        WHERE ir.brain_id = cm.brain_id AND ir.address_key = cm.address_key AND ir.superseded_by IS NULL
      )
    `;
    const result = await pool.query(query, [brainId]);
    return result.rows.map(row => ({
      type: 'coverage_gap',
      address_key: row.address_key,
      detail: 'Coverage gap detected - previously populated region now empty',
      severity: 'critical'
    }));
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'sentinel',
      brain_id: brainId,
      message: 'Coverage gap check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
    return [{
      type: 'coverage_gap',
      address_key: 'unknown',
      detail: error instanceof Error ? error.message : 'Unknown error',
      severity: 'critical'
    }];
  }
}

export async function runSentinelChecks(brainId: string): Promise<SentinelReport> {
  const startTime = Date.now();
  const anomalies: SentinelAnomaly[] = [];

  const confidenceDriftResults = await checkConfidenceDrift(brainId);
  anomalies.push(...confidenceDriftResults);

  const velocitySpikeResults = await checkVelocitySpike(brainId);
  anomalies.push(...velocitySpikeResults);

  const coverageGapResults = await checkCoverageGap(brainId);
  anomalies.push(...coverageGapResults);

  return {
    brain_id: brainId,
    checked_at: new Date().toISOString(),
    anomalies,
    duration_ms: Date.now() - startTime
  };
}

export async function startSentinel(brainIds: string[]): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  intervalId = setInterval(async () => {
    try {
      for (const brainId of brainIds) {
        const report = await runSentinelChecks(brainId);
        if (report.anomalies.length > 0) {
          console.log(JSON.stringify({
            timestamp: report.checked_at,
            level: 'warn',
            component: 'sentinel',
            brain_id: brainId,
            message: 'Sentinel anomalies detected',
            anomalies: report.anomalies
          }));
        }
      }
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'sentinel',
        message: 'Sentinel loop error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, 60000);
}

export function stopSentinel(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
}