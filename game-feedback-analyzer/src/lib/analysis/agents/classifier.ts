import { callClaude, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type { ClassificationResult } from '@/types';

export interface ClassifierInput {
  responses: Array<{ id: string; text: string }>;
  categories: string[];
  buildId?: string;
  analysisLevel?: string;
}

export async function classifyFeedback(
  input: ClassifierInput
): Promise<ClassificationResult> {
  const systemPrompt = await loadPrompt('agent1-classifier.md');

  const userMessage = JSON.stringify({
    responses: input.responses,
    categories: input.categories,
  });

  const response = await callClaude(systemPrompt, userMessage, 'sonnet', {
    maxTokens: 8192,
  });

  await logAPICost(response, {
    agent: 'classifier',
    buildId: input.buildId,
    analysisLevel: input.analysisLevel,
  });

  return parseJsonResponse<ClassificationResult>(response);
}
