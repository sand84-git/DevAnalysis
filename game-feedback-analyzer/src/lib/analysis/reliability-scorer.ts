import type { ReliabilityIndicator } from '@/types';

interface ReliabilityInput {
  totalResponses: number;
  aiConfidences: number[];
  sentimentDistribution: Record<string, number>;
}

export function calculateReliability(input: ReliabilityInput): ReliabilityIndicator {
  const { totalResponses, aiConfidences, sentimentDistribution } = input;

  // Sample reliability based on count
  const sampleReliability: 'low' | 'medium' | 'high' =
    totalResponses >= 30 ? 'high' :
    totalResponses >= 10 ? 'medium' : 'low';

  // Average AI confidence
  const aiConfidenceAvg = aiConfidences.length > 0
    ? aiConfidences.reduce((s, v) => s + v, 0) / aiConfidences.length
    : 0;

  // Bias index: how skewed the sentiment distribution is (0 = balanced, 1 = all same)
  const sentimentValues = Object.values(sentimentDistribution);
  const totalSentiments = sentimentValues.reduce((s, v) => s + v, 0);
  let biasIndex = 0;
  if (totalSentiments > 0) {
    const maxRatio = Math.max(...sentimentValues) / totalSentiments;
    biasIndex = Math.round(maxRatio * 100) / 100;
  }

  return {
    sampleReliability,
    sampleCount: totalResponses,
    aiConfidenceAvg: Math.round(aiConfidenceAvg * 100) / 100,
    biasIndex,
  };
}
