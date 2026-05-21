import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { createHash } from 'crypto';
import { requireScope } from './routes';

const registerWebhookSchema = z.object({
  brain_id: z.string().uuid(),
  url: z.string().url().startsWith('https://'),
  events: z.array(z.string()).min(1),
  secret: z.string().min(16),
});

const getWebhooksQuerySchema = z.object({
  brain_id: z.string().uuid(),
});

const getDeliveriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export function createWebhooksRouter(): Router {
  const router = Router();

  router.post('/v1/webhooks', requireScope('invoke'), async (req: Request, res: Response) => {
    try {
      const parsedBody = registerWebhookSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parsedBody.error.errors });
      }

      const { brain_id, url, events, secret } = parsedBody.data;
      const pool = req.app.get('pgPool') as Pool;
      const secretHash = createHash('sha256').update(secret).digest('hex');

      const insertQuery = `
        INSERT INTO webhook_registrations (id, brain_id, url, secret_hash, events, active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, TRUE, NOW(), NOW())
        RETURNING id, brain_id, url, events, active;
      `;
      const values = [brain_id, url, secretHash, events];

      const result = await pool.query(insertQuery, values);
      const row = result.rows[0];

      return res.status(201).json({
        webhook_id: row.id,
        brain_id: row.brain_id,
        url: row.url,
        events: row.events,
        active: row.active,
      });
    } catch (error) {
      console.error('Error registering webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/v1/webhooks', requireScope('invoke'), async (req: Request, res: Response) => {
    try {
      const parsedQuery = getWebhooksQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: parsedQuery.error.errors });
      }

      const { brain_id } = parsedQuery.data;
      const pool = req.app.get('pgPool') as Pool;

      const selectQuery = `
        SELECT id, brain_id, url, events, active, created_at
        FROM webhook_registrations
        WHERE brain_id = $1
        ORDER BY created_at DESC;
      `;
      const result = await pool.query(selectQuery, [brain_id]);

      return res.status(200).json({ webhooks: result.rows });
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/v1/webhooks/:webhookId', requireScope('invoke'), async (req: Request, res: Response) => {
    try {
      const webhookId = req.params['webhookId'] as string;
      if (!z.string().uuid().safeParse(webhookId).success) {
        return res.status(400).json({ error: 'Invalid webhook ID format' });
      }

      const pool = req.app.get('pgPool') as Pool;

      const updateQuery = `
        UPDATE webhook_registrations
        SET active = FALSE, updated_at = NOW()
        WHERE id = $1
        RETURNING id;
      `;
      const result = await pool.query(updateQuery, [webhookId]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      return res.status(200).json({ webhook_id: webhookId, status: 'deactivated' });
    } catch (error) {
      console.error('Error deactivating webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/v1/webhooks/:webhookId/deliveries', requireScope('invoke'), async (req: Request, res: Response) => {
    try {
      const webhookId = req.params['webhookId'] as string;
      if (!z.string().uuid().safeParse(webhookId).success) {
        return res.status(400).json({ error: 'Invalid webhook ID format' });
      }

      const parsedQuery = getDeliveriesQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: parsedQuery.error.errors });
      }

      const { limit } = parsedQuery.data;
      const pool = req.app.get('pgPool') as Pool;

      const selectQuery = `
        SELECT id, event_type, status, attempt_count, last_attempt_at, delivered_at, response_status, created_at
        FROM webhook_deliveries
        WHERE registration_id = $1
        ORDER BY created_at DESC
        LIMIT $2;
      `;
      const result = await pool.query(selectQuery, [webhookId, limit]);

      return res.status(200).json({ deliveries: result.rows });
    } catch (error) {
      console.error('Error fetching webhook deliveries:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}