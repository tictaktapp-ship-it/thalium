import { Redis } from '@upstash/redis';
import { Pool } from 'pg';

type ConfidenceSample = {
  score: number;
  recorded_at: string;
};

type BrainState = {
  domain_uncertainty: boolean;
  [key: string]: unknown;
};

const shardA = new Redis({
  url: process.env.UPSTASH_REDIS_SHARD_A_URL!,
  token: process.env.UPSTASH_REDIS_SHARD_A_TOKEN!,
});

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let isRunning = false;
let activeBrainIds: string[] = [];
let intervalRef: NodeJS.Timeout | null = null;

const getThresholdForBrain = async (brainId: string): Promise<number> => {
  try {
    const res = await pgPool.query<{ threshold: string | null }>(
      `SELECT config->>'confidence_monitor_threshold' as threshold FROM brain_instances WHERE id = $1`,
      [brainId]
    );
    const threshold = res.rows[0]?.threshold ? Number(res.rows[0].threshold) : 65;
    return isNaN(threshold) ? 65 : threshold;
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      component: 'confidence-monitor',
      brain_id: brainId,
      message: 'Failed to fetch threshold from Postgres, using default',
      error: error instanceof Error ? error.message : String(error),
    }));
    return 65;
  }
};

const processBrain = async (brainId: string): Promise<void> => {
  try {
    const samples = await shardA.lrange<ConfidenceSample>(`confidence_samples:${brainId}`, 0, -1);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const recentSamples = samples.filter(sample => 
      new Date(sample.recorded_at) >= fiveMinutesAgo
    );

    if (recentSamples.length < 5) return;

    const sum = recentSamples.reduce((acc, sample) => acc + sample.score, 0);
    const rollingAvg = sum / recentSamples.length;
    const threshold = await getThresholdForBrain(brainId);

    const currentStateRaw = await shardA.get<string>(`brain_state:${brainId}`);
    let currentState: BrainState = currentStateRaw ? JSON.parse(currentStateRaw) : { domain_uncertainty: false };

    if (rollingAvg < threshold) {
      if (!currentState.domain_uncertainty) {
        currentState.domain_uncertainty = true;
        await shardA.set(`brain_state:${brainId}`, JSON.stringify(currentState), { ex: 24 * 60 * 60 });
        console.log(JSON.stringify({
          timestamp: now.toISOString(),
          level: 'INFO',
          component: 'confidence-monitor',
          brain_id: brainId,
          message: 'Set domain_uncertainty flag',
          rolling_avg: rollingAvg,
          sample_count: recentSamples.length,
          threshold,
        }));
      }
    } else if (currentState.domain_uncertainty) {
      currentState.domain_uncertainty = false;
      await shardA.set(`brain_state:${brainId}`, JSON.stringify(currentState), { ex: 24 * 60 * 60 });
      console.log(JSON.stringify({
        timestamp: now.toISOString(),
        level: 'INFO',
        component: 'confidence-monitor',
        brain_id: brainId,
        message: 'Cleared domain_uncertainty flag',
        rolling_avg: rollingAvg,
        sample_count: recentSamples.length,
        threshold,
      }));
    }
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component: 'confidence-monitor',
      brain_id: brainId,
      message: 'Error processing brain',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
};

const tick = async (): Promise<void> => {
  if (!isRunning) return;
  await Promise.all(activeBrainIds.map(processBrain));
};

export const startConfidenceMonitor = async (brainIds: string[]): Promise<void> => {
  if (isRunning) return;
  isRunning = true;
  activeBrainIds = [...brainIds];
  intervalRef = setInterval(tick, 30 * 1000);
};

export const recordConfidenceSample = async (brainId: string, score: number): Promise<void> => {
  try {
    const sample: ConfidenceSample = {
      score,
      recorded_at: new Date().toISOString(),
    };
    await shardA.lpush(`confidence_samples:${brainId}`, JSON.stringify(sample));
    await shardA.ltrim(`confidence_samples:${brainId}`, 0, 199);
    await shardA.expire(`confidence_samples:${brainId}`, 10 * 60);
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component: 'confidence-monitor',
      brain_id: brainId,
      message: 'Error recording confidence sample',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
};

export const stopConfidenceMonitor = (): void => {
  isRunning = false;
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
};

