import { callLLM, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type { ClassificationResult, ClassifiedResponse, ClassifiedResponseSlim, Sentiment } from '@/types';

const BATCH_SIZE = 50;
const CONCURRENCY = 3;

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
  let completedCount = 0;

  onProgress?.(0, responses.length);

  // 최대 CONCURRENCY개 배치를 동시 처리
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (batch) => {
        const result = await classifyBatch(
          { ...input, responses: batch },
          batch
        );
        completedCount += batch.length;
        onProgress?.(completedCount, responses.length);
        return result;
      })
    );
    for (const result of chunkResults) {
      allClassified.push(...result.classifiedResponses);
      allSuggestions.push(...result.newCategorySuggestions);
    }
  }

  // Merge categorySummary from all classified responses
  const categorySummary = buildCategorySummary(allClassified);

  return {
    classifiedResponses: allClassified,
    categorySummary,
    newCategorySuggestions: [...new Set(allSuggestions)],
  };
}

interface SlimClassificationResult {
  classifiedResponses: ClassifiedResponseSlim[];
  categorySummary: ClassificationResult['categorySummary'];
  newCategorySuggestions: string[];
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

  const response = await callLLM(systemPrompt, userMessage, 'grok', {
    maxTokens: 16384,
  });

  await logAPICost(response, {
    agent: 'classifier',
    buildId: input.buildId,
    analysisLevel: input.analysisLevel,
  });

  const slimResult = parseJsonResponse<SlimClassificationResult>(response);

  // text를 input에서 재구성 (API output 토큰 절약)
  const textMap = new Map(batchResponses.map((r) => [r.id, r.text]));
  const classifiedResponses: ClassifiedResponse[] = slimResult.classifiedResponses.map((slim) => ({
    ...slim,
    text: textMap.get(slim.id) ?? '',
  }));

  return {
    classifiedResponses,
    categorySummary: slimResult.categorySummary,
    newCategorySuggestions: slimResult.newCategorySuggestions,
  };
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
