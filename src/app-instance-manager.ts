import express from 'express';
import {
  createBrainInstance,
  getBrainInstance,
  pauseBrainInstance,
  validateBrainInstanceConfig
} from './api/instance-manager';
import { ZodError } from 'zod';
import { LibrarianError } from './lib/librarian-write';

const app = express();

app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', app: 'instance-manager' });
});

app.post('/v1/brain', async (req, res) => {
  try {
    const validatedConfig = validateBrainInstanceConfig(req.body);
    const result = await createBrainInstance(validatedConfig);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid configuration', details: error.errors });
    } else {
      console.error('Error creating brain instance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.get('/v1/brain/:id', async (req, res) => {
  try {
    const instance = await getBrainInstance(req.params.id);
    if (!instance) {
      res.status(404).json({ error: 'Brain instance not found' });
    } else {
      res.json(instance);
    }
  } catch (error) {
    console.error('Error retrieving brain instance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/v1/brain/:id/pause', async (req, res) => {
  try {
    await pauseBrainInstance(req.params.id);
    res.json({ status: 'paused' });
  } catch (err) {
    if (err instanceof LibrarianError && err.code === 'VALIDATION_FAILED') {
      res.status(404).json({ error: (err as LibrarianError).message });
    } else {
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

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Instance Manager listening on port ${PORT}`);
});