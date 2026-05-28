import { Pool } from 'pg';
import { z } from 'zod';

const DecayEntrySchema = z.object({
  address_key: z.string(),
  decaying_count: z.number(),
  avg_confidence: z.number(),
  oldest_accessed_at: z.string(),
});

const DriftEntrySchema = z.object({
  address_key: z.string(),
  recent_avg: z.number(),
  prior_avg: z.number(),
  decline: z.number(),
});

const ConcentrationEntrySchema = z.object({
  prefix: z.string(),
  entry_count: z.number(),
  percentage: z.number(),
});

const EpidemiologistReportSchema = z.object({
  brain_id: z.string(),
  analysed_at: z.string(),
  decay: z.array(DecayEntrySchema),
  drift: z.array(DriftEntrySchema),
  concentration: z.array(ConcentrationEntrySchema),
  duration_ms: z.number(),
});

type DecayEntry = z.infer<typeof DecayEntrySchema>;
type DriftEntry = z.infer<typeof DriftEntrySchema>;
type ConcentrationEntry = z.infer<typeof ConcentrationEntrySchema>;
type EpidemiologistReport = z.infer<typeof EpidemiologistReportSchema>;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

async function runMemoryDecayAnalysis(brainId: string): Promise<DecayEntry[]> {
  try {
    const query = `
      SELECT address_key::text, COUNT(*) as decaying_count, AVG(avg_confidence) as avg_confidence, MIN(last_accessed_at)::text as oldest_accessed_at
      FROM institutional_ring
      WHERE brain_id = $1 AND superseded_by IS NULL AND last_accessed_at < now() - interval '30 days' AND access_count < 5
      GROUP BY address_key
      ORDER BY decaying_count DESC
      LIMIT 20
    `;
    const result = await pool.query(query, [brainId]);
    return DecayEntrySchema.array().parse(result.rows);
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component: 'epidemiologist',
      brain_id: brainId,
      message: 'Memory decay analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    return [];
  }
}

async function runDriftPatternAnalysis(brainId: string): Promise<DriftEntry[]> {
  try {
    const query = `
      SELECT r.address_key::text,
        AVG(CASE WHEN r.created_at > now() - interval '7 days' THEN r.avg_confidence END) as recent_avg,
        AVG(CASE WHEN r.created_at BETWEEN now() - interval '14 days' AND now() - interval '7 days' THEN r.avg_confidence END) as prior_avg
      FROM institutional_ring r
      WHERE r.brain_id = $1 AND r.superseded_by IS NULL
      GROUP BY r.address_key
      HAVING AVG(CASE WHEN r.created_at > now() - interval '7 days' THEN r.avg_confidence END) IS NOT NULL
        AND AVG(CASE WHEN r.created_at BETWEEN now() - interval '14 days' AND now() - interval '7 days' THEN r.avg_confidence END) IS NOT NULL
        AND AVG(CASE WHEN r.created_at > now() - interval '7 days' THEN r.avg_confidence END) < AVG(CASE WHEN r.created_at BETWEEN now() - interval '14 days' AND now() - interval '7 days' THEN r.avg_confidence END) - 10
    `;
    const result = await pool.query(query, [brainId]);
    return DriftEntrySchema.array().parse(result.rows.map(row => ({
      ...row,
      decline: row.recent_avg - row.prior_avg,
    })));
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component: 'epidemiologist',
      brain_id: brainId,
      message: 'Drift pattern analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    return [];
  }
}

async function runRiskConcentrationAnalysis(brainId: string): Promise<ConcentrationEntry[]> {
  try {
    const query = `
      WITH total AS (SELECT COUNT(*) as total_count FROM institutional_ring WHERE brain_id = $1 AND superseded_by IS NULL),
      prefix_counts AS (
        SELECT split_part(address_key::text, '.', 1) || '.' || split_part(address_key::text, '.', 2) as prefix,
        COUNT(*) as entry_count
        FROM institutional_ring WHERE brain_id = $1 AND superseded_by IS NULL
        GROUP BY prefix
      )
      SELECT p.prefix, p.entry_count, ROUND((p.entry_count::numeric / t.total_count) * 100, 1) as percentage
      FROM prefix_counts p, total t
      WHERE (p.entry_count::numeric / t.total_count) > 0.6
      ORDER BY percentage DESC
    `;
    const result = await pool.query(query, [brainId]);
    return ConcentrationEntrySchema.array().parse(result.rows);
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component: 'epidemiologist',
      brain_id: brainId,
      message: 'Risk concentration analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    return [];
  }
}

export async function runEpidemiologistAnalysis(brainId: string): Promise<EpidemiologistReport> {
  const startTime = Date.now();
  const [decay, drift, concentration] = await Promise.all([
    runMemoryDecayAnalysis(brainId),
    runDriftPatternAnalysis(brainId),
    runRiskConcentrationAnalysis(brainId),
  ]);
  const durationMs = Date.now() - startTime;

  const report = EpidemiologistReportSchema.parse({
    brain_id: brainId,
    analysed_at: new Date().toISOString(),
    decay,
    drift,
    concentration,
    duration_ms: durationMs,
  });

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    component: 'epidemiologist',
    brain_id: brainId,
    message: 'Epidemiologist analysis completed',
    report,
  }));

  return report;
}

export async function startEpidemiologist(brainIds: string[]): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  const runAnalysisLoop = async () => {
    for (const brainId of brainIds) {
      await runEpidemiologistAnalysis(brainId);
    }
  };

  intervalId = setInterval(runAnalysisLoop, 10 * 60 * 1000);
  await runAnalysisLoop();
}

export function stopEpidemiologist(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
}