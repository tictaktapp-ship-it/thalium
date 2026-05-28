import { Pool } from 'pg';
import { createHmac } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: 'DATABASE_URL environment variable is not set.',
    service: 'webhook-dispatcher'
  }));
  process.exit(1);
}

const pgPool = new Pool({
  connectionString: DATABASE_URL,
});

let dispatcherInterval: NodeJS.Timeout | null = null;
const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const HTTP_TIMEOUT_MS = 10 * 1000; // 10 seconds

interface WebhookDelivery {
  id: string;
  registration_id: string;
  payload: any;
  attempt_count: number;
  url: string;
  secret_hash: string;
}

const RETRY_INTERVALS_SECONDS = [60, 300, 900]; // 1st retry after 60s, 2nd after 300s, 3rd after 900s

async function dispatchWebhook(delivery: WebhookDelivery): Promise<void> {
  const { id, payload, url, secret_hash, attempt_count } = delivery;
  let responseStatus: number | null = null;
  let success = false;

  try {
    const body = JSON.stringify(payload);
    const hmac = createHmac('sha256', secret_hash);
    const signature = hmac.update(body).digest('hex');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Thalium-Signature': signature,
        },
        body: body,
        signal: controller.signal,
      });
      responseStatus = response.status;
      success = response.ok;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'WARN',
          message: 'Webhook dispatch timed out.',
          deliveryId: id,
          url: url,
          service: 'webhook-dispatcher'
        }));
      } else {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Webhook dispatch failed.',
          deliveryId: id,
          url: url,
          error: error.message,
          service: 'webhook-dispatcher'
        }));
      }
      success = false;
    } finally {
      clearTimeout(timeoutId);
    }

    if (success) {
      await pgPool.query(
        `UPDATE webhook_deliveries SET status='delivered', delivered_at=now(), response_status=$1, attempt_count=attempt_count+1, last_attempt_at=now() WHERE id=$2`,
        [responseStatus, id]
      );
      console.info(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Webhook delivered successfully.',
        deliveryId: id,
        url: url,
        responseStatus: responseStatus,
        service: 'webhook-dispatcher'
      }));
    } else {
      const nextAttemptCount = attempt_count + 1;
      if (nextAttemptCount < 3) {
        const retryInterval = RETRY_INTERVALS_SECONDS[nextAttemptCount - 1];
        await pgPool.query(
          `UPDATE webhook_deliveries SET status='retrying', attempt_count=$1, last_attempt_at=now(), next_retry_at=now() + interval '${retryInterval} seconds', response_status=$2 WHERE id=$3`,
          [nextAttemptCount, responseStatus, id]
        );
        console.warn(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'WARN',
          message: 'Webhook dispatch failed, retrying.',
          deliveryId: id,
          url: url,
          attempt: nextAttemptCount,
          nextRetryInSeconds: retryInterval,
          responseStatus: responseStatus,
          service: 'webhook-dispatcher'
        }));
      } else {
        await pgPool.query(
          `UPDATE webhook_deliveries SET status='failed', attempt_count=$1, last_attempt_at=now(), response_status=$2 WHERE id=$3`,
          [nextAttemptCount, responseStatus, id]
        );
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Webhook dispatch failed after multiple attempts.',
          deliveryId: id,
          url: url,
          attempt: nextAttemptCount,
          responseStatus: responseStatus,
          service: 'webhook-dispatcher'
        }));
      }
    }
  } catch (error: any) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Unhandled error during webhook dispatch or status update.',
      deliveryId: id,
      url: url,
      error: error.message,
      stack: error.stack,
      service: 'webhook-dispatcher'
    }));
    // Ensure the delivery is marked as failed if an unhandled error occurs during processing
    try {
      await pgPool.query(
        `UPDATE webhook_deliveries SET status='failed', attempt_count=attempt_count+1, last_attempt_at=now(), response_status=$1 WHERE id=$2`,
        [responseStatus, id]
      );
    } catch (updateError: any) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Failed to mark webhook delivery as failed after unhandled error.',
        deliveryId: id,
        url: url,
        originalError: error.message,
        updateError: updateError.message,
        service: 'webhook-dispatcher'
      }));
    }
  }
}

async function pollAndDispatch(): Promise<void> {
  try {
    const { rows } = await pgPool.query<WebhookDelivery>(
      `SELECT wd.id, wd.registration_id, wd.payload, wd.attempt_count, wr.url, wr.secret_hash 
       FROM webhook_deliveries wd 
       JOIN webhook_registrations wr ON wd.registration_id=wr.id 
       WHERE wd.status IN ('pending','retrying') 
         AND (wd.next_retry_at IS NULL OR wd.next_retry_at <= now()) 
         AND wr.active=true 
       LIMIT 50`
    );

    if (rows.length > 0) {
      console.info(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Found ${rows.length} pending/retrying webhook deliveries.`,
        service: 'webhook-dispatcher'
      }));
    }

    for (const delivery of rows) {
      // Dispatch each webhook concurrently but handle errors individually
      void dispatchWebhook(delivery); // Use void to explicitly ignore Promise return for fire-and-forget
    }
  } catch (error: any) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Error during polling for webhook deliveries.',
      error: error.message,
      stack: error.stack,
      service: 'webhook-dispatcher'
    }));
  }
}

export async function startWebhookDispatcher(): Promise<void> {
  if (dispatcherInterval) {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: 'Webhook dispatcher already running.',
      service: 'webhook-dispatcher'
    }));
    return;
  }

  console.info(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'Starting webhook dispatcher.',
    pollIntervalMs: POLL_INTERVAL_MS,
    service: 'webhook-dispatcher'
  }));

  // Run once immediately, then set interval
  await pollAndDispatch();
  dispatcherInterval = setInterval(() => {
    void pollAndDispatch(); // Use void to explicitly ignore Promise return for fire-and-forget
  }, POLL_INTERVAL_MS);
}

export function stopWebhookDispatcher(): void {
  if (dispatcherInterval) {
    clearInterval(dispatcherInterval);
    dispatcherInterval = null;
    console.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Stopped webhook dispatcher.',
      service: 'webhook-dispatcher'
    }));
  } else {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: 'Webhook dispatcher not running.',
      service: 'webhook-dispatcher'
    }));
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'SIGTERM received, stopping webhook dispatcher.',
    service: 'webhook-dispatcher'
  }));
  stopWebhookDispatcher();
  await pgPool.end();
  console.info(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'PostgreSQL pool closed.',
    service: 'webhook-dispatcher'
  }));
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.info(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'SIGINT received, stopping webhook dispatcher.',
    service: 'webhook-dispatcher'
  }));
  stopWebhookDispatcher();
  await pgPool.end();
  console.info(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'PostgreSQL pool closed.',
    service: 'webhook-dispatcher'
  }));
  process.exit(0);
});



