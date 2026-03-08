import { callClaude, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type { ClassificationResult, ClassifiedResponse, Sentiment } from '@/types';

const BATCH_SIZE = 50;

export interface ClassifierInput {
  responses: Array<{ id: string; text: string }>;
  categories: string[];
  buildId?: string;
  analysisLevel?: string;
}

export type ClassifyProgressCallback = (completed: number, total: number) => void;

export async function classifyFeedback(
  input: ClassifierInput,
  onProgress?: ClassifyProgressCallback
): Promise<ClassificationResult> {
  const { responses, categories } = input;

  // Small enough for single batch
  if (responses.length <= BATCH_SIZE) {
    onProgress?.(0, responses.length);
    const result = await classifyBatch(input, responses);
    onProgress?.(responses.length, responses.length);
    return result;
  }

  // Split into batches
  const batches: Array<{ id: string; text: string }>[] = [];
  for (let i = 0; i < responses.length; i += BATCH_SIZE) {
    batches.push(responses.slice(i, i + BATCH_SIZE));
  }

  const allClassified: ClassifiedResponse[] = [];
  const allSuggestions: string[] = [];

  onProgress?.(0, responses.length);

  for (const batch of batches) {
    const batchResult = await classifyBatch(
      { ...input, responses: batch },
      batch
    );
    allClassified.push(...batchResult.classifiedResponses);
    allSuggestions.push(...batchResult.newCategorySuggestions);
    onProgress?.(allClassified.length, responses.length);
  }

  // Merge categorySummary from all classified responses
  const categorySummary = buildCategorySummary(allClassified);

  return {
    classifiedResponses: allClassified,
    categorySummary,
    newCategorySuggestions: [...new Set(allSuggestions)],
  };
}

async function classifyBatch(
  input: ClassifierInput,
  batchResponses: Array<{ id: string; text: string }>
): Promise<ClassificationResult> {
  const systemPrompt = await loadPrompt('agent1-classifier.md');

  const userMessage = JSON.stringify({
    responses: batchResponses,
    categories: input.categories,
  });

  const response = await callClaude(systemPrompt, userMessage, 'sonnet', {
    maxTokens: 16384,
  });

  await logAPICost(response, {
    agent: 'classifier',
    buildId: input.buildId,
    analysisLevel: input.analysisLevel,
  });

  return parseJsonResponse<ClassificationResult>(response);
}

function buildCategorySummary(
  classifiedResponses: ClassifiedResponse[]
): ClassificationResult['categorySummary'] {
  const summary: ClassificationResult['categorySummary'] = {};

  for (const resp of classifiedResponses) {
    for (const cat of resp.categories) {
      if (!summary[cat]) {
        summary[cat] = {
          count: 0,
          sentimentBreakdown: {
            positive: 0,
            enthusiastic: 0,
            constructive_negative: 0,
            frustrated: 0,
            neutral: 0,
            mixed: 0,
          } as Record<Sentiment, number>,
          topQuotes: [],
        };
      }
      summary[cat].count++;
      summary[cat].sentimentBreakdown[resp.sentiment] =
        (summary[cat].sentimentBreakdown[resp.sentiment] ?? 0) + 1;

      if (resp.isKeyQuote && summary[cat].topQuotes.length < 3) {
        summary[cat].topQuotes.push(resp.text.slice(0, 200));
      }
    }
  }

  return summary;
}
