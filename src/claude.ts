import Anthropic from '@anthropic-ai/sdk';
import { logger } from './utils/logger.ts';

export interface CallClaudeArgs {
  system: string;
  user: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CallClaudeResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

const RETRY_ATTEMPTS = 2;
const RETRY_BASE_MS = 1000;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('sk-ant-...')) {
    throw new Error(
      'ANTHROPIC_API_KEY is missing or unset. Copy .env.example to .env and add your key from https://console.anthropic.com.',
    );
  }
  return new Anthropic({ apiKey });
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Call Anthropic's messages API with retry-on-failure (2 retries, base 1s
 * exponential). Extracts plain text content from the response and reports
 * token usage.
 *
 * TODO (Phase 2): streaming support — useful when a generation runs long
 * enough that the operator wants to see progress.
 *
 * TODO (Phase 2): prompt caching via cache_control once the system+context
 * exceeds ~1024 tokens. The TRP bootstrap context will easily blow past that
 * once it's real, and caching saves both latency and cost on iteration runs.
 */
export async function callClaude(args: CallClaudeArgs): Promise<CallClaudeResult> {
  const client = getClient();
  const { system, user, model, maxTokens = 16_000, temperature = 0.7 } = args;

  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) {
        const wait = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        logger.warn(`Claude call failed; retrying`, { attempt, waitMs: wait });
        await delay(wait);
      }

      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: user }],
      });

      const text = response.content
        .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      return {
        text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: response.model,
      };
    } catch (err) {
      lastError = err;
      logger.debug('Claude call threw', { error: String(err) });
    }
  }

  throw new Error(
    `Claude call failed after ${RETRY_ATTEMPTS + 1} attempts: ${String(lastError)}`,
  );
}
