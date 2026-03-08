import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ModelTier = 'sonnet' | 'opus';

const MODEL_IDS: Record<ModelTier, string> = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-6',
};

const PRICING: Record<ModelTier, { input: number; output: number; cacheRead: number }> = {
  sonnet: { input: 3 / 1_000_000, output: 15 / 1_000_000, cacheRead: 0.3 / 1_000_000 },
  opus: { input: 15 / 1_000_000, output: 75 / 1_000_000, cacheRead: 1.5 / 1_000_000 },
};

export interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUSD: number;
  model: ModelTier;
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model: ModelTier = 'sonnet',
  options?: { maxTokens?: number }
): Promise<ClaudeResponse> {
  const response = await anthropic.messages.create({
    model: MODEL_IDS[model],
    max_tokens: options?.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const cacheReadTokens = (response.usage as unknown as Record<string, number>).cache_read_input_tokens ?? 0;
  const pricing = PRICING[model];

  const costUSD =
    inputTokens * pricing.input +
    outputTokens * pricing.output +
    cacheReadTokens * pricing.cacheRead;

  const content = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return {
    content,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    costUSD,
    model,
  };
}

export function parseJsonResponse<T>(response: ClaudeResponse): T {
  const text = response.content;
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Claude response');
  }
  const jsonStr = jsonMatch[1] ?? jsonMatch[0];
  return JSON.parse(jsonStr) as T;
}
