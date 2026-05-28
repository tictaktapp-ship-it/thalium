import { SSEEmitter } from '../chain/coordinator';
import { LibrarianError } from '../lib/librarian-write';

const VALID_EVENTS = new Set([
  'fast.triage',
  'fast.artifact',
  'full.triage',
  'full.listener',
  'full.interrogator',
  'full.architect',
  'full.devil',
  'full.scorer',
  'full.validator',
  'full.boundary_keeper',
  'full.scribe',
  'full.auditor',
  'full.librarian',
  'full.artifact',
  'chain.chunked',
  'chain.novel',
  'chain.partial',
  'chain.timeout',
  'instance.consolidating',
  'instance.domain_uncertainty',
  'instance.resumed',
  'instance.postgres_degraded',
  'chain.novel_queue_full',
]);

const VALID_ROLES = new Set([
  'triage',
  'listener',
  'interrogator',
  'architect',
  'devil',
  'scorer',
  'validator',
  'boundary_keeper',
  'scribe',
  'auditor',
  'librarian',
]);

export function isValidSSEEvent(event: string): boolean {
  if (VALID_EVENTS.has(event)) {
    return true;
  }

  if (event.startsWith('full.')) {
    const role = event.split('.')[1];
    return role !== undefined && VALID_ROLES.has(role);
  }

  return false;
}

export function createSSEResponse(res: { write: (data: string) => boolean; end: () => void }): ThaliumSSEEmitter {
  if ('setHeader' in res) {
    if (typeof (res as Record<string, unknown>).setHeader === 'function') { (res as Record<string, unknown> & { setHeader: (k: string, v: string) => void }).setHeader('Content-Type', 'text/event-stream');
    (res as Record<string, unknown> & { setHeader: (k: string, v: string) => void }).setHeader('Cache-Control', 'no-cache');
    (res as Record<string, unknown> & { setHeader: (k: string, v: string) => void }).setHeader('Connection', 'keep-alive'); }
  }

  return new ThaliumSSEEmitter(res);
}

export class ThaliumSSEEmitter implements SSEEmitter {
  private eventId: number = 0;
  private closed: boolean = false;

  constructor(private readonly res: {
    write: (data: string) => boolean;
    end: () => void;
  }) {}

  emit(event: string, data: unknown): void {
    if (!isValidSSEEvent(event)) {
      throw new LibrarianError(`Unknown SSE event name: ${event}`, 'VALIDATION_FAILED');
    }

    if (this.closed) {
      console.warn(`Attempted to emit event ${event} on closed SSE stream`);
      return;
    }

    this.eventId++;
    const sseData = `id: ${this.eventId}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    try {
      const success = this.res.write(sseData);
      if (!success) {
        this.closed = true;
        console.warn(`Failed to write SSE data for event ${event}`);
      }
    } catch (error) {
      this.closed = true;
      console.warn(`Error writing SSE data for event ${event}:`, error);
    }
  }

  close(): void {
    try {
      this.res.write('\n');
      this.res.end();
    } finally {
      this.closed = true;
    }
  }
}