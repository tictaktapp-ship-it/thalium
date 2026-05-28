import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Pool } from 'pg';
import { Redis } from '@upstash/redis';
import { createRouter } from './api/routes';
import { createOutcomeRouter } from './api/outcome';
import { healthHandler } from './api/health';

const PORT = parseInt(process.env.PORT ?? '8080', 10);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const shardC = new Redis({ url: process.env.UPSTASH_REDIS_SHARD_C_URL!, token: process.env.UPSTASH_REDIS_SHARD_C_TOKEN! });

const app = express();

app.use(express.json({ limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path !== '/health') {
    const start = Date.now();
    res.on('finish', () => {
      const latency = Date.now() - start;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        component: 'chain-executor',
        method: req.method,
        path: req.path,
        status: res.statusCode,
        latency_ms: latency
      }));
    });
  }
  next();
});

app.set('pgPool', pool);
app.set('redisShardC', shardC);

app.use('/health', healthHandler);
app.use('/', createRouter());
app.use('/', createOutcomeRouter());

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', component: 'chain-executor', message: err.message, stack: err.stack }));
  res.status(500).json({ error: 'internal_error' });
});

const server = createServer(app);

function shutdown(signal: string): void {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', component: 'chain-executor', message: 'Shutting down', signal }));
  server.close(() => {
    pool.end().then(() => process.exit(0)).catch(() => process.exit(1));
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', component: 'chain-executor', message: 'Server started', port: PORT, node_version: process.version }));
});