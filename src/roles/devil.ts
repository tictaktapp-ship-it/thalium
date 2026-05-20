import { writeContribution } from '../lib/anchor';
import { AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from '../lib/librarian-write';

export interface DevilOutput {
  challenges: string[];
  risk_score: number;
  missing_elements: string[];
  verdict: 'pass' | 'pass_with_concerns' | 'fail';
  reasoning: string;
}

export interface DevilResult {
  output: DevilOutput;
  anchor_contribution: AnchorContribution;
}

export function buildDevilPrompt(input: string, architectArtifact: string, intentType: string, domain: string): string {
  return `You are the Devil's Advocate critically analyzing an Architect's output. Your task is to identify:
1. Logical weaknesses and contradictions
2. Implementation risks
3. Missing elements or considerations
4. Domain-specific vulnerabilities

Input Context:
- Intent Type: ${intentType}
- Domain: ${domain}
- User Input: ${input}

Architect's Artifact:
${architectArtifact}

Return ONLY a JSON object with this structure:
{
  "challenges": ["array", "of", "specific", "weaknesses"],
  "risk_score": 0.75,
  "missing_elements": ["array", "of", "missing", "components"],
  "verdict": "pass_with_concerns",
  "reasoning": "detailed analysis"
}

Rules:
- risk_score must be between 0 and 1
- verdict must be pass, pass_with_concerns, or fail
- Be brutally honest but constructive
- Focus on technical feasibility and domain fit`;
}

export async function devil(
  sessionId: string,
  input: string,
  architectArtifact: string,
  intentType: string,
  domain: string
): Promise<DevilResult> {
  if (!input || !architectArtifact || !intentType || !domain) {
    throw new LibrarianError('All parameters must be non-empty strings', 'VALIDATION_FAILED');
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    throw new LibrarianError('OPENROUTER_API_KEY environment variable not set', 'ENV_MISSING');
  }

  const prompt = buildDevilPrompt(input, architectArtifact, intentType, domain);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new LibrarianError(`OpenRouter API request failed with status ${response.status}`, 'API_REQUEST_FAILED');
    }

    const data = await response.json();
    const messageObj = ((data as Record<string, unknown>)?.choices as Record<string, unknown>[])?.[0]?.message as Record<string, unknown> | undefined;
    const content = messageObj?.content as string | undefined;

    if (!content) {
      throw new LibrarianError('No content in API response', 'API_RESPONSE_INVALID');
    }

    let devilOutput: DevilOutput;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      devilOutput = JSON.parse(cleanedContent);
    } catch (e) {
      throw new LibrarianError('Failed to parse API response JSON', 'VALIDATION_FAILED');
    }

    if (typeof devilOutput.risk_score !== 'number' || devilOutput.risk_score < 0 || devilOutput.risk_score > 1) {
      throw new LibrarianError('risk_score must be between 0 and 1', 'VALIDATION_FAILED');
    }

    if (!['pass', 'pass_with_concerns', 'fail'].includes(devilOutput.verdict)) {
      throw new LibrarianError('verdict must be pass, pass_with_concerns, or fail', 'VALIDATION_FAILED');
    }

    const contribution: AnchorContribution = {
      role: 'devil',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: devilOutput
    };

    await writeContribution(sessionId, contribution);

    return {
      output: devilOutput,
      anchor_contribution: contribution
    };
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    throw new LibrarianError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`, 'UNEXPECTED_ERROR');
  }
}