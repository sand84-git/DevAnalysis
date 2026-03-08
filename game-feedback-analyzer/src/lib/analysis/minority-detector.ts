import type { Sentiment } from '@/types';

interface MinoritySegment {
  segmentColumn: string;
  segmentValue: string;
  respondentCount: number;
  totalCount: number;
  ratio: number;
  dominantSentiment: Sentiment;
  divergenceFromMajority: number;
}

interface MinorityDetectorInput {
  segmentAnalyses: Array<{
    segmentColumn: string;
    segments: Array<{
      segmentValue: string;
      respondentCount: number;
      sentimentBreakdown: Record<Sentiment, number>;
    }>;
  }>;
  overallSentiment: Record<Sentiment, number>;
  totalRespondents: number;
}

export function detectMinoritySegments(input: MinorityDetectorInput): MinoritySegment[] {
  const { segmentAnalyses, overallSentiment, totalRespondents } = input;
  const minorities: MinoritySegment[] = [];

  const overallTotal = Object.values(overallSentiment).reduce((s, v) => s + v, 0);
  if (overallTotal === 0) return minorities;

  const overallRatios: Record<string, number> = {};
  for (const [sentiment, count] of Object.entries(overallSentiment)) {
    overallRatios[sentiment] = count / overallTotal;
  }

  for (const analysis of segmentAnalyses) {
    for (const segment of analysis.segments) {
      const segTotal = Object.values(segment.sentimentBreakdown).reduce((s, v) => s + v, 0);
      if (segTotal < 3) continue; // Too small to analyze

      const ratio = segment.respondentCount / totalRespondents;
      if (ratio >= 0.3) continue; // Not a minority segment

      // Find dominant sentiment in this segment
      let maxSentiment: Sentiment = 'neutral';
      let maxCount = 0;
      for (const [sentiment, count] of Object.entries(segment.sentimentBreakdown)) {
        if (count > maxCount) {
          maxCount = count;
          maxSentiment = sentiment as Sentiment;
        }
      }

      // Calculate divergence from overall
      const segRatio = maxCount / segTotal;
      const overallRatio = overallRatios[maxSentiment] ?? 0;
      const divergence = Math.abs(segRatio - overallRatio);

      if (divergence >= 0.15) {
        minorities.push({
          segmentColumn: analysis.segmentColumn,
          segmentValue: segment.segmentValue,
          respondentCount: segment.respondentCount,
          totalCount: totalRespondents,
          ratio,
          dominantSentiment: maxSentiment,
          divergenceFromMajority: divergence,
        });
      }
    }
  }

  return minorities.sort((a, b) => b.divergenceFromMajority - a.divergenceFromMajority);
}
