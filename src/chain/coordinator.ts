import { triage } from '../roles/triage';
import { listen } from '../roles/listener';
import { interrogate } from '../roles/interrogator';
import { architect } from '../roles/architect';
import { devil } from '../roles/devil';
import { score } from '../roles/scorer';
import { validate } from '../roles/validator';
import { enforceeBoundaries } from '../roles/boundary-keeper';
import { scribe } from '../roles/scribe';
import { audit } from '../roles/auditor';
import { runLibrarian } from '../roles/librarian';
import { createAnchor } from '../lib/anchor';
import { LibrarianError } from '../lib/librarian-write';

export interface ChainInput {
  input: string;
  brainId: string;
  domain: string;
  sessionId: string;
}

export interface SSEEmitter {
  emit(event: string, data: unknown): void;
}

export async function runChain(chainInput: ChainInput, emitter: SSEEmitter): Promise<void> {
  const { input, brainId, domain, sessionId } = chainInput;
  const startedAt = new Date();
  let addressKey = 'intent_clarification.org.general.general';
  let attemptCount = 0;
  let partialArtifact: unknown = null;

  try {
    await createAnchor(sessionId, brainId, addressKey);
    emitter.emit('fast.triage', { sessionId, brainId });

    while (attemptCount < 2) {
      try {
        const triageResult = await triage(input, brainId, domain);
        emitter.emit('full.triage', triageResult);
        addressKey = triageResult.address_key;

        const listenerResult = await listen(sessionId, input, addressKey, brainId);
        emitter.emit('full.listener', listenerResult);

        const interrogatorResult = await interrogate(sessionId, input, listenerResult.intent_object.prediction_error_score, addressKey);
        emitter.emit('full.interrogator', interrogatorResult);
        if (interrogatorResult.activated) {
          emitter.emit('chain.partial', interrogatorResult);
          partialArtifact = interrogatorResult;
          break;
        }

        const architectResult = await architect(sessionId, input, addressKey, triageResult.intent_type, domain);
        emitter.emit('full.architect', architectResult);

        const devilResult = await devil(sessionId, input, String(architectResult.output.structured_artifact), triageResult.intent_type, domain);
        emitter.emit('full.devil', devilResult);

        const scorerResult = await score(sessionId, brainId, addressKey);
        emitter.emit('full.scorer', scorerResult);
        emitter.emit('fast.artifact', { confidence_score: scorerResult.output.confidence_score, gate_decision: scorerResult.output.gate_decision });

        const validatorResult = await validate(sessionId, triageResult.intent_type);
        emitter.emit('full.validator', validatorResult);
        if (validatorResult.output.verdict === 'reclassify') {
          emitter.emit('chain.novel', { sessionId, brainId });
          attemptCount++;
          continue;
        }
        if (validatorResult.output.verdict === 'novel_signal') {
          emitter.emit('chain.novel', { sessionId, brainId });
          break;
        }

        const boundaryResult = await enforceeBoundaries(sessionId, String(architectResult.output.structured_artifact), domain, brainId);
        emitter.emit('full.boundary_keeper', boundaryResult);
        if (boundaryResult.output.action === 'block') {
          emitter.emit('chain.partial', boundaryResult);
          partialArtifact = boundaryResult;
          break;
        }

        const scribeResult = await scribe(sessionId, brainId, addressKey);
        emitter.emit('full.scribe', scribeResult);
        emitter.emit('full.artifact', scribeResult);

        await audit(sessionId, brainId, addressKey, startedAt);
        emitter.emit('full.auditor', { sessionId, brainId });

        await runLibrarian(sessionId, brainId, addressKey, domain);
        emitter.emit('full.librarian', { sessionId, brainId });

        break;
      } catch (error) {
        emitter.emit('chain.partial', { errorMessage: error instanceof Error ? error.message : String(error), error, sessionId, brainId });
        partialArtifact = { error, sessionId, brainId };
        break;
      }
    }
  } catch (error) {
    emitter.emit('chain.partial', { errorMessage: error instanceof Error ? error.message : String(error), error, sessionId, brainId });
    partialArtifact = { error, sessionId, brainId };
  } finally {
    try {
      await audit(sessionId, brainId, addressKey, startedAt);
      emitter.emit('full.auditor', { sessionId, brainId });

      await runLibrarian(sessionId, brainId, addressKey, domain);
      emitter.emit('full.librarian', { sessionId, brainId });

      if (partialArtifact) {
        emitter.emit('chain.partial', partialArtifact);
      }
    } catch (error) {
      emitter.emit('chain.partial', { errorMessage: error instanceof Error ? error.message : String(error), error, sessionId, brainId });
    }
  }
}