import express, { Express, Request, Response } from 'express';
import Stripe from 'stripe';
import { Pool } from 'pg';
import { z } from 'zod';
import { invalidateSubscriptionCache } from '../../lib/billing-enforcer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const MetadataSchema = z.object({
  org_id: z.string(),
  plan: z.enum(['spark', 'neuron', 'lobe', 'studio', 'enterprise']),
});

const PLAN_LIMITS = {
  spark: 500,
  neuron: 3500,
  lobe: 30000,
  studio: 100000,
  enterprise: null,
};

function log(level: string, message: string, context: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    component: 'stripe-webhook',
    message,
    ...context,
  }));
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const metadataParse = MetadataSchema.safeParse(session.metadata);
  if (!metadataParse.success) {
    log('warn', 'Invalid metadata in checkout session', { sessionId: session.id });
    return;
  }

  const { org_id, plan } = metadataParse.data;
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;

  try {
    await pool.query(
      `INSERT INTO stripe_customers (id, org_id, stripe_customer_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, NOW())
       ON CONFLICT (org_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id`,
      [org_id, stripeCustomerId]
    );

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await pool.query(
      `INSERT INTO subscriptions (
        id, org_id, stripe_subscription_id, stripe_customer_id, plan, status,
        current_period_start, current_period_end, cancel_at_period_end,
        invocation_limit, is_internal, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW(), NOW()
      ) ON CONFLICT (org_id) DO UPDATE SET
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        plan = EXCLUDED.plan,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        invocation_limit = EXCLUDED.invocation_limit,
        updated_at = NOW()`,
      [
        org_id,
        stripeSubscriptionId,
        stripeCustomerId,
        plan,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.cancel_at_period_end,
        PLAN_LIMITS[plan],
      ]
    );

    await pool.query(
      `INSERT INTO billing_events (id, org_id, event_type, payload, occurred_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [org_id, 'subscription_activated', { plan, stripe_subscription_id: stripeSubscriptionId }]
    );

    await invalidateSubscriptionCache(org_id);
  } catch (error) {
    log('error', 'Error handling checkout.session.completed', { error: error instanceof Error ? error.message : error });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;

    const orgRes = await pool.query<{ org_id: string }>(
      'SELECT org_id FROM stripe_customers WHERE stripe_customer_id = $1',
      [customerId]
    );

    if ((orgRes.rowCount ?? 0) === 0) {
      log('warn', 'Customer not found for subscription update', { subscriptionId });
      return;
    }

    const org_id = orgRes.rows[0]?.org_id; if (!org_id) { log('warn', 'org_id missing from customer row', {}); return; }

    const prevStatusRes = await pool.query<{ status: string }>(
      'SELECT status FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscriptionId]
    );

    const previousStatus = (prevStatusRes.rowCount ?? 0) > 0 ? (prevStatusRes.rows[0]?.status ?? null) : null;

    await pool.query(
      `UPDATE subscriptions SET
        status = $1,
        current_period_start = $2,
        current_period_end = $3,
        cancel_at_period_end = $4,
        updated_at = NOW()
       WHERE stripe_subscription_id = $5`,
      [
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.cancel_at_period_end,
        subscriptionId,
      ]
    );

    if (previousStatus !== 'active' && subscription.status === 'active') {
      await pool.query(
        `INSERT INTO billing_events (id, org_id, event_type, payload, occurred_at)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
        [org_id, 'subscription_activated', { stripe_subscription_id: subscriptionId }]
      );
    }

    if (subscription.cancel_at_period_end) {
      await pool.query(
        `INSERT INTO billing_events (id, org_id, event_type, payload, occurred_at)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
        [org_id, 'subscription_canceled', { cancel_at: subscription.cancel_at !== null ? new Date(subscription.cancel_at * 1000).toISOString() : null }]
      );
    }

    await invalidateSubscriptionCache(org_id);
  } catch (error) {
    log('error', 'Error handling customer.subscription.updated', { error: error instanceof Error ? error.message : error });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;

    const orgRes = await pool.query<{ org_id: string }>(
      'SELECT org_id FROM stripe_customers WHERE stripe_customer_id = $1',
      [customerId]
    );

    if ((orgRes.rowCount ?? 0) === 0) {
      log('warn', 'Customer not found for subscription deletion', { subscriptionId });
      return;
    }

    const org_id = orgRes.rows[0]?.org_id; if (!org_id) { log('warn', 'org_id missing from customer row', {}); return; }

    await pool.query(
      `UPDATE subscriptions SET status = 'canceled', updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );

    await pool.query(
      `INSERT INTO billing_events (id, org_id, event_type, payload, occurred_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [org_id, 'subscription_canceled', { reason: 'subscription_deleted' }]
    );

    await invalidateSubscriptionCache(org_id);
  } catch (error) {
    log('error', 'Error handling customer.subscription.deleted', { error: error instanceof Error ? error.message : error });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;

    const orgRes = await pool.query<{ org_id: string }>(
      'SELECT org_id FROM stripe_customers WHERE stripe_customer_id = $1',
      [customerId]
    );

    if ((orgRes.rowCount ?? 0) === 0) {
      log('warn', 'Customer not found for failed payment', { invoiceId: invoice.id });
      return;
    }

    const org_id = orgRes.rows[0]?.org_id; if (!org_id) { log('warn', 'org_id missing from customer row', {}); return; }

    await pool.query(
      `UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );

    await pool.query(
      `INSERT INTO billing_events (id, org_id, event_type, payload, occurred_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [org_id, 'payment_failed', { invoice_id: invoice.id, attempt_count: invoice.attempt_count }]
    );

    await invalidateSubscriptionCache(org_id);
  } catch (error) {
    log('error', 'Error handling invoice.payment_failed', { error: error instanceof Error ? error.message : error });
  }
}

async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        log('info', `Unhandled event type: ${event.type}`);
    }

    res.sendStatus(200);
  } catch (error) {
    if (error instanceof Error) {
      log('warn', 'Invalid Stripe webhook signature', { error: error.message });
    }
    res.sendStatus(400);
  }
}

export function registerStripeWebhookRoute(app: Express) {
  app.post(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );
}


