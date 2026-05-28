import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { healthHandler } from './api/health';
import { startConfidenceMonitor, stopConfidenceMonitor } from './jobs/confidence-monitor';
import { startHealthMonitor, stopHealthMonitor } from './jobs/health-monitor';
import { startSentinel, stopSentinel } from './jobs/sentinel';
import { startEpidemiologist, stopEpidemiologist } from './jobs/epidemiologist';

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT ?? '8081', 10);
const brainIds = (process.env.ACTIVE_BRAIN_IDS ?? '').split(',').filter(Boolean);

if (brainIds.length === 0) {
    console.log(JSON.stringify({ 
        timestamp: new Date().toISOString(), 
        level: 'WARNING', 
        component: 'instance-manager', 
        message: 'No ACTIVE_BRAIN_IDS provided - starting with empty brainIds array' 
    }));
}

app.use(express.json({ limit: '10mb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path !== '/health') {
        const startTime = process.hrtime();
        res.on('finish', () => {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const duration = seconds * 1000 + nanoseconds / 1000000;
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                component: 'instance-manager',
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: duration.toFixed(2)
            }));
        });
    }
    next();
});

app.get('/health', healthHandler);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        component: 'instance-manager',
        error: err instanceof Error ? err.stack : String(err)
    }));
    res.status(500).json({ error: 'Internal Server Error' });
});

async function shutdown(signal: string): Promise<void> {
    console.log(JSON.stringify({ 
        timestamp: new Date().toISOString(), 
        level: 'INFO', 
        component: 'instance-manager', 
        message: 'Shutting down', 
        signal 
    }));
    stopConfidenceMonitor();
    stopHealthMonitor();
    stopSentinel();
    stopEpidemiologist();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, '0.0.0.0', () => {
    startConfidenceMonitor(brainIds);
    startHealthMonitor();
    startSentinel(brainIds);
    startEpidemiologist(brainIds);
    console.log(JSON.stringify({ 
        timestamp: new Date().toISOString(), 
        level: 'INFO', 
        component: 'instance-manager', 
        message: 'Server started', 
        port: PORT, 
        brain_ids_count: brainIds.length, 
        node_version: process.version 
    }));
});

