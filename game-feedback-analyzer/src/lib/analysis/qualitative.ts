import { classifyFeedback } from '@/lib/analysis/agents/classifier';
import type { ClassifyProgressCallback } from '@/lib/analysis/agents/classifier';
import { analyzeAsUserAdvocate } from '@/lib/analysis/agents/user-advocate';
import { analyzeAsDesignAdvocate } from '@/lib/analysis/agents/design-advocate';
import { synthesizeDeep, synthesizeQuick } from '@/lib/analysis/agents/synthesizer';
import type {
  AnalysisLevel,
  ClassificationResult,
  UserAdvocateResult,
  DesignAdvocateResult,
  SynthesisResult,
  Sentiment,
} from '@/types';

export interface QualitativeInput {
  responses: Array<{ id: string; text: string }>;
  categories: string[];
  directionDoc?: string;
  analysisLevel: AnalysisLevel;
  buildId?: string;
}

export interface AnalysisOutput {
  classification: ClassificationResult;
  userAdvocate?: UserAdvocateResult;
  designAdvocate?: DesignAdvocateResult;
  synthesis: SynthesisResult;
  sentimentAggregation: Record<Sentiment, number>;
}

export type StageStatus = 'started' | 'progress' | 'completed';

export interface StageEvent {
  stage: string;
  status: StageStatus;
  detail?: string;
  completed?: number;
  total?: number;
}

export type OnStageChange = (event: StageEvent) => void;

const ALL_SENTIMENTS: Sentiment[] = [
  'positive',
  'enthusiastic',
  'constructive_negative',
  'frustrated',
  'neutral',
  'mixed',
];

export function aggregateSentiments(
  classification: ClassificationResult
): Record<Sentiment, number> {
  const counts: Record<Sentiment, number> = {
    positive: 0,
    enthusiastic: 0,
    constructive_negative: 0,
    frustrated: 0,
    neutral: 0,
    mixed: 0,
  };

  for (const resp of classification.classifiedResponses) {
    if (ALL_SENTIMENTS.includes(resp.sentiment)) {
      counts[resp.sentiment]++;
    }
  }

  return counts;
}

export async function runQualitativeAnalysis(
  input: QualitativeInput,
  onStageChange?: OnStageChange
): Promise<AnalysisOutput> {
  const { responses, categories, directionDoc, analysisLevel, buildId } = input;

  // Stage 1: Classification (all levels)
  onStageChange?.({ stage: 'classify', status: 'started' });

  const classifyProgress: ClassifyProgressCallback = (completed, total) => {
    onStageChange?.({
      stage: 'classify',
      status: 'progress',
      detail: `${completed}/${total} 응답 분류 완료`,
      completed,
      total,
    });
  };

  const classification = await classifyFeedback(
    { responses, categories, buildId, analysisLevel },
    classifyProgress
  );

  onStageChange?.({ stage: 'classify', status: 'completed' });

  const sentimentAggregation = aggregateSentiments(classification);

  // Quick: Agent1 → Agent4-Quick (2 API calls)
  if (analysisLevel === 'quick') {
    onStageChange?.({ stage: 'synthesis', status: 'started' });

    const synthesis = await synthesizeQuick({
      classificationResult: classification,
      buildId,
      analysisLevel,
    });

    onStageChange?.({ stage: 'synthesis', status: 'completed' });

    return {
      classification,
      synthesis,
      sentimentAggregation,
    };
  }

  // Standard: Agent1 → Agent2 → Agent4 (3 API calls)
  if (analysisLevel === 'standard') {
    onStageChange?.({ stage: 'user_advocate', status: 'started' });

    const userAdvocate = await analyzeAsUserAdvocate({
      classificationResult: classification,
      buildId,
      analysisLevel,
    });

    onStageChange?.({ stage: 'user_advocate', status: 'completed' });
    onStageChange?.({ stage: 'synthesis', status: 'started' });

    const synthesis = await synthesizeDeep({
      userAdvocateResult: userAdvocate,
      buildId,
      analysisLevel,
    });

    onStageChange?.({ stage: 'synthesis', status: 'completed' });

    return {
      classification,
      userAdvocate,
      synthesis,
      sentimentAggregation,
    };
  }

  // Deep: Agent1 → Agent2+Agent3 (parallel) → Agent4 (4 calls, 3 wait stages)
  onStageChange?.({ stage: 'user_advocate', status: 'started' });
  onStageChange?.({ stage: 'design_advocate', status: 'started' });

  const [userAdvocate, designAdvocate] = await Promise.all([
    analyzeAsUserAdvocate({
      classificationResult: classification,
      buildId,
      analysisLevel,
    }),
    analyzeAsDesignAdvocate({
      classificationResult: classification,
      directionDoc: directionDoc ?? '',
      buildId,
      analysisLevel,
    }),
  ]);

  onStageChange?.({ stage: 'user_advocate', status: 'completed' });
  onStageChange?.({ stage: 'design_advocate', status: 'completed' });
  onStageChange?.({ stage: 'synthesis', status: 'started' });

  const synthesis = await synthesizeDeep({
    userAdvocateResult: userAdvocate,
    designAdvocateResult: designAdvocate,
    buildId,
    analysisLevel,
  });

  onStageChange?.({ stage: 'synthesis', status: 'completed' });

  return {
    classification,
    userAdvocate,
    designAdvocate,
    synthesis,
    sentimentAggregation,
  };
}
