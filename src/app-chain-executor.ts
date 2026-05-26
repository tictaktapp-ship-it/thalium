// src/app-chain-executor.ts
import express from 'express';
import { registerStripeWebhookRoute } from './routes/webhooks/stripe';
import { handleChainInvocation } from './api/chain-executor';
import { createRouter } from './api/routes';
import { ZodError } from 'zod';

const app = express();

// Stripe webhook must be registered before express.json() to receive raw body
registerStripeWebhookRoute(app);
app.use(express.json());
app.use(createRouter());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', app: 'chain-executor' });
});

app.post('/v1/invoke', async (req, res) => {
  try {
    await handleChainInvocation(req, res);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
    } else {
      console.error('Unhandled error in chain invocation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

const PORT = parseInt(process.env.PORT ?? '8080', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chain Executor listening on port ${PORT}`);
});
