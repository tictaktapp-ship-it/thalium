import { readAnchor, writeContribution } from '../lib/anchor';
import { AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from '../lib/librarian-write';
import { z } from 'zod';

export interface ArchitectOutput {
  structured_artifact: string;
  sections: string[];
  confidence: number;
  reasoning: string;
}

export interface ArchitectResult {
  output: ArchitectOutput;
  anchor_contribution: AnchorContribution;
}

const architectOutputSchema = z.object({
  structured_artifact: z.string().min(1),
  sections: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1),
});

export function buildArchitectPrompt(input: string, intentType: string, domain: string): string {
  return `You are an Architect structuring a ${intentType} artifact for domain ${domain}. 
  Input: ${input}
  
  Return ONLY a JSON object with these exact fields:
  - structured_artifact: The complete structured output
  - sections: Array of section headings
  - confidence: Your confidence in this output (0-1)
  - reasoning: Your reasoning for this structure
  
  Respond with ONLY the JSON object, no other text or formatting.`;
}

export async function architect(
  sessionId: string,
  input: string,
  addressKey: string,
  intentType: string,
  domain: string
): Promise<ArchitectResult> {
  if (!input || !addressKey || !intentType || !domain) {
    throw new LibrarianError('All parameters must be non-empty strings', 'VALIDATION_FAILED');
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new LibrarianError('OPENROUTER_API_KEY not set', 'VALIDATION_FAILED');
  }

  const prompt = buildArchitectPrompt(input, intentType, domain);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new LibrarianError(`OpenRouter API failed with status ${response.status}`, 'WRITE_FAILED');
    }

    const data = await response.json();
    const content = ((data as Record<string, unknown>)?.choices as Record<string, unknown>[])?.[0]?.message as Record<string, unknown> | undefined; const contentStr = (content as Record<string, unknown> | undefined)?.content as string | undefined;
    if (!content) {
      throw new LibrarianError('No content in OpenRouter response', 'VALIDATION_FAILED');
    }

    const cleanedStr = contentStr!.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedOutput = architectOutputSchema.safeParse(JSON.parse(cleanedStr));
    if (!parsedOutput.success) {
      throw new LibrarianError('Invalid output structure from model', 'VALIDATION_FAILED');
    }

    const contribution: AnchorContribution = {
      role: 'architect',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: parsedOutput.data,
    };

    await writeContribution(sessionId, contribution);

    return {
      output: parsedOutput.data,
      anchor_contribution: contribution,
    };
  } catch (error) {
    if (error instanceof LibrarianError) {
      throw error;
    }
    throw new LibrarianError(`Architect failed: ${error instanceof Error ? error.message : String(error)}`, 'WRITE_FAILED');
  }
}