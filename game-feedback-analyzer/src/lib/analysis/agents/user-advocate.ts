import { callClaude, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type { ClassificationResult, UserAdvocateResult } from '@/types';

export interface UserAdvocateInput {
  classificationResult: ClassificationResult;
  buildId?: string;
  analysisLevel?: string;
}

export async function analyzeAsUserAdvocate(
  input: UserAdvocateInput
): Promise<UserAdvocateResult> {
  const systemPrompt = await loadPrompt('agent2-user-advocate.md');

  const userMessage = JSON.stringify({
    categorySummary: input.classificationResult.categorySummary,
    classifiedResponses: input.classificationResult.classifiedResponses,
  });

  const response = await callClaude(systemPrompt, userMessage, 'sonnet', {
    maxTokens: 4096,
  });

  await logAPICost(response, {
    agent: 'user-advocate',
    buildId: input.buildId,
    analysisLevel: input.analysisLevel,
  });

  return parseJsonResponse<UserAdvocateResult>(response);
}
