import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// 지연 초기화 (env 로드 타이밍 이슈 방지)
let _anthropic: Anthropic | null = null;
let _xai: OpenAI | null = null;

function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

function getXai() {
  if (!_xai) _xai = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' });
  return _xai;
}

export type ModelTier = 'sonnet' | 'opus' | 'grok';

const MODEL_IDS: Record<ModelTier, string> = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-6',
  grok: 'grok-4-1-fast-reasoning',
};

const PRICING: Record<ModelTier, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  sonnet: { input: 3 / 1_000_000, output: 15 / 1_000_000, cacheRead: 0.3 / 1_000_000, cacheWrite: 3.75 / 1_000_000 },
  opus: { input: 15 / 1_000_000, output: 75 / 1_000_000, cacheRead: 1.5 / 1_000_000, cacheWrite: 18.75 / 1_000_000 },
  grok: { input: 0.2 / 1_000_000, output: 0.5 / 1_000_000, cacheRead: 0.05 / 1_000_000, cacheWrite: 0.2 / 1_000_000 },
};

export interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  costUSD: number;
  model: ModelTier;
}

export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  model: ModelTier = 'sonnet',
  options?: { maxTokens?: number }
): Promise<ClaudeResponse> {
  if (model === 'grok') {
    return callGrok(systemPrompt, userMessage, options);
  }
  return callClaude(systemPrompt, userMessage, model, options);
}

async function callGrok(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number }
): Promise<ClaudeResponse> {
  const response = await getXai().chat.completions.create({
    model: MODEL_IDS.grok,
    max_tokens: options?.maxTokens ?? 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const pricing = PRICING.grok;

  const costUSD =
    inputTokens * pricing.input +
    outputTokens * pricing.output;

  const content = response.choices[0]?.message?.content ?? '';

  return {
    content,
    inputTokens,
    outputTokens,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    costUSD,
    model: 'grok',
  };
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model: ModelTier = 'sonnet',
  options?: { maxTokens?: number }
): Promise<ClaudeResponse> {
  const response = await getAnthropic().messages.create({
    model: MODEL_IDS[model],
    max_tokens: options?.maxTokens ?? 4096,
    system: [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  const usage = response.usage as unknown as Record<string, number>;
  const inputTokens = usage.input_tokens;
  const outputTokens = usage.output_tokens;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
  const pricing = PRICING[model];

  // 캐시 히트된 토큰은 cacheRead 가격, 캐시 생성 토큰은 cacheWrite 가격, 나머지는 input 가격
  const nonCachedInputTokens = inputTokens - cacheReadTokens - cacheCreationTokens;
  const costUSD =
    nonCachedInputTokens * pricing.input +
    outputTokens * pricing.output +
    cacheReadTokens * pricing.cacheRead +
    cacheCreationTokens * pricing.cacheWrite;

  const content = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return {
    content,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreationTokens,
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

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // 잘린 JSON 복구 시도: 닫히지 않은 브래킷/브레이스 닫기
    const repaired = repairTruncatedJson(jsonStr);
    return JSON.parse(repaired) as T;
  }
}

function repairTruncatedJson(json: string): string {
  let repaired = json.trim();

  // 마지막 불완전한 문자열 값 제거 (닫히지 않은 따옴표)
  const lastQuote = repaired.lastIndexOf('"');
  if (lastQuote > 0) {
    const before = repaired.slice(0, lastQuote);
    const quoteCount = (before.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      // 홀수 따옴표 = 닫히지 않은 문자열, 마지막 키-값 쌍 제거
      const lastComma = repaired.lastIndexOf(',', lastQuote);
      if (lastComma > 0) {
        repaired = repaired.slice(0, lastComma);
      }
    }
  }

  // 닫히지 않은 브래킷/브레이스 닫기
  const opens: string[] = [];
  let inString = false;
  let escaped = false;
  for (const ch of repaired) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') opens.push(ch);
    if (ch === '}' || ch === ']') opens.pop();
  }

  while (opens.length > 0) {
    const open = opens.pop();
    repaired += open === '{' ? '}' : ']';
  }

  return repaired;
}
