import { callLLM, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type { ClassificationResult, UserAdvocateResult, Sentiment } from '@/types';

export interface UserAdvocateInput {
  classificationResult: ClassificationResult;
  sentimentAggregation: Record<Sentiment, number>;
  buildId?: string;
  analysisLevel?: string;
}

export async function analyzeAsUserAdvocate(
  input: UserAdvocateInput
): Promise<UserAdvocateResult> {
  const systemPrompt = await loadPrompt('agent2-user-advocate.md');

  const userMessage = JSON.stringify({
    categorySummary: input.classificationResult.categorySummary,
    sentimentAggregation: input.sentimentAggregation,
    totalResponses: input.classificationResult.classifiedResponses.length,
  });

  const response = await callLLM(systemPrompt, userMessage, 'grok', {
    maxTokens: 4096,
  });

  await logAPICost(response, {
    agent: 'user-advocate',
    buildId: input.buildId,
    analysisLevel: input.analysisLevel,
  });

  return parseJsonResponse<UserAdvocateResult>(response);
}
