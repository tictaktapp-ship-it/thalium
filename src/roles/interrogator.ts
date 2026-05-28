import { readAnchor, writeContribution } from '../lib/anchor';
import { AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from '../lib/librarian-write';

export interface InterrogatorResult {
  activated: boolean;
  questions: string[];
  pause_timeout_minutes: number;
  anchor_contribution: AnchorContribution;
}

export const INTERROGATOR_THRESHOLD = 0.7;
export const DEFAULT_PAUSE_TIMEOUT_MINUTES = 10;

export async function interrogate(
  sessionId: string,
  input: string,
  predictionErrorScore: number,
  addressKey: string
): Promise<InterrogatorResult> {
  try {
    const baseQuestions = [
      'What is the primary goal of this request?',
      'What constraints or requirements should be considered?'
    ];

    const questions = [...baseQuestions];
    if (addressKey.startsWith('specification')) {
      questions.push('Who will be executing this specification?');
    } else if (addressKey.startsWith('diagnosis')) {
      questions.push('When did this issue first appear?');
    }

    if (predictionErrorScore < INTERROGATOR_THRESHOLD) {
      const contribution: AnchorContribution = {
        role: 'interrogator',
        status: 'skipped',
        written_at: new Date().toISOString(),
        payload: {
          activated: false,
          reason: 'prediction_error_score below threshold'
        }
      };
      await writeContribution(sessionId, contribution);

      return {
        activated: false,
        questions: [],
        pause_timeout_minutes: DEFAULT_PAUSE_TIMEOUT_MINUTES,
        anchor_contribution: contribution
      };
    }

    const contribution: AnchorContribution = {
      role: 'interrogator',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: {
        activated: true,
        questions,
        paused_at: new Date().toISOString()
      }
    };
    await writeContribution(sessionId, contribution);

    return {
      activated: true,
      questions,
      pause_timeout_minutes: DEFAULT_PAUSE_TIMEOUT_MINUTES,
      anchor_contribution: contribution
    };
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    throw new LibrarianError(
      'INTERROGATOR_FAILURE',
      `Failed to interrogate: ${error instanceof Error ? error.message : String(error)}`,
      { sessionId, addressKey }
    );
  }
}
