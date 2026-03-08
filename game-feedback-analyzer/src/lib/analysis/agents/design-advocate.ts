import { callClaude, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type { ClassificationResult, DesignAdvocateResult } from '@/types';

export interface DesignAdvocateInput {
  classificationResult: ClassificationResult;
  directionDoc: string;
  buildId?: string;
  analysisLevel?: string;
}

export async function analyzeAsDesignAdvocate(
  input: DesignAdvocateInput
): Promise<DesignAdvocateResult> {
  const systemPrompt = await loadPrompt('agent3-design-advocate.md');

  const userMessage = JSON.stringify({
    categorySummary: input.classificationResult.categorySummary,
    classifiedResponses: input.classificationResult.classifiedResponses,
    directionDoc: input.directionDoc,
  });

  const response = await callClaude(systemPrompt, userMessage, 'sonnet', {
    maxTokens: 4096,
  });

  await logAPICost(response, {
    agent: 'design-advocate',
    buildId: input.buildId,
    analysisLevel: input.analysisLevel,
  });

  return parseJsonResponse<DesignAdvocateResult>(response);
}
