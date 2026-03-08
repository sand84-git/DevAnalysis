import { callClaude, callLLM, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type {
  ClassificationResult,
  UserAdvocateResult,
  DesignAdvocateResult,
  SynthesisResult,
} from '@/types';

export interface SynthesizeDeepInput {
  userAdvocateResult: UserAdvocateResult;
  designAdvocateResult?: DesignAdvocateResult;
  buildId?: string;
  analysisLevel?: string;
}

export interface SynthesizeQuickInput {
  classificationResult: ClassificationResult;
  buildId?: string;
  analysisLevel?: string;
}

export async function synthesizeDeep(
  input: SynthesizeDeepInput
): Promise<SynthesisResult> {
  const systemPrompt = await loadPrompt('agent4-synthesizer.md');

  const userMessage = JSON.stringify({
    userAdvocateResult: input.userAdvocateResult,
    designAdvocateResult: input.designAdvocateResult ?? null,
  });

  const response = await callClaude(systemPrompt, userMessage, 'sonnet', {
    maxTokens: 8192,
  });

  await logAPICost(response, {
    agent: 'synthesizer',
    buildId: input.buildId,
    analysisLevel: input.analysisLevel,
  });

  return parseJsonResponse<SynthesisResult>(response);
}

export async function synthesizeQuick(
  input: SynthesizeQuickInput
): Promise<SynthesisResult> {
  const systemPrompt = await loadPrompt('agent4-synthesizer-quick.md');

  const userMessage = JSON.stringify({
    classificationResult: input.classificationResult,
  });

  const response = await callLLM(systemPrompt, userMessage, 'grok', {
    maxTokens: 4096,
  });

  await logAPICost(response, {
    agent: 'synthesizer-quick',
    buildId: input.buildId,
    analysisLevel: input.analysisLevel,
  });

  return parseJsonResponse<SynthesisResult>(response);
}
