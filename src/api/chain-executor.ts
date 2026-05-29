import { runChain, ChainInput } from '../chain/coordinator';
import { createSSEResponse } from '../sse/emitter';
import { LibrarianError } from '../lib/librarian-write';
import { randomUUID } from 'crypto';
import { z } from 'zod';

export interface InvocationRequest {
  input: string;
  brain_id: string;
  domain: string;
  session_id?: string | undefined;
}

export interface InvocationResponse {
  session_id: string;
  status: 'streaming' | 'error';
}

const InvocationRequestSchema = z.object({
  input: z.string().min(1),
  brain_id: z.string().min(1),
  domain: z.string().min(1),
  session_id: z.string().optional(),
  suppress_interrogator: z.boolean().optional(),
});

export function validateInvocationRequest(body: unknown): InvocationRequest {
  const result = InvocationRequestSchema.safeParse(body);
  if (!result.success) {
    throw new LibrarianError('Invalid invocation request', 'VALIDATION_FAILED');
  }
  return result.data;
}

export async function handleChainInvocation(
  req: {
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
  },
  res: {
    write: (data: string) => boolean;
    end: () => void;
    setHeader: (key: string, value: string) => void;
    status: (code: number) => { json: (body: unknown) => void };
  }
): Promise<void> {
  try {
    const internalHeader = req.headers['x-thalium-internal'];
    if (internalHeader !== process.env.X_THALIUM_INTERNAL) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const request = validateInvocationRequest(req.body);
    const sessionId = request.session_id || randomUUID();

    const emitter = createSSEResponse(res);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const chainInput: ChainInput = {
      input: request.input,
      brainId: request.brain_id,
      domain: request.domain,
      sessionId,
      suppressInterrogator: (request as any).suppress_interrogator ?? false,
    };

    try {
      await runChain(chainInput, emitter);
    } catch (error) {
      emitter.emit('chain.partial', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      emitter.close();
    }
  } catch (error) {
    if (error instanceof LibrarianError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}