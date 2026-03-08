import type { Sentiment } from '@/types';

export interface ScoreDistribution {
  columnName: string;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  histogram: Array<{ bin: string; count: number }>;
}

export interface ChoiceFrequency {
  columnName: string;
  choices: Array<{ value: string; count: number; percentage: number }>;
}

export interface SegmentAnalysis {
  segmentColumn: string;
  segments: Array<{
    segmentValue: string;
    respondentCount: number;
    sentimentBreakdown: Record<Sentiment, number>;
    avgScore?: number;
  }>;
}

export interface QuantitativeResult {
  scoreDistributions: ScoreDistribution[];
  choiceFrequencies: ChoiceFrequency[];
  segmentAnalyses: SegmentAnalysis[];
  totalRespondents: number;
}

export interface QuantitativeInput {
  rows: Array<Record<string, string>>;
  columnTypes: Record<string, 'score' | 'choice' | 'open_text' | 'meta'>;
  sentimentMap?: Record<string, Sentiment>;
}

function parseNumber(value: string): number | null {
  const n = Number(value);
  return isNaN(n) ? null : n;
}

function calculateMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const sumSqDiff = values.reduce((sum, v) => sum + (v - mean) ** 2, 0);
  return Math.sqrt(sumSqDiff / (values.length - 1));
}

function computeScoreDistribution(
  columnName: string,
  values: number[]
): ScoreDistribution {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const median = calculateMedian(sorted);
  const stdDev = calculateStdDev(values, mean);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Build histogram with 5 bins
  const range = max - min || 1;
  const binCount = Math.min(5, Math.ceil(range));
  const binSize = range / binCount;
  const histogram: Array<{ bin: string; count: number }> = [];

  for (let i = 0; i < binCount; i++) {
    const lo = min + i * binSize;
    const hi = i === binCount - 1 ? max : min + (i + 1) * binSize;
    const label = `${lo.toFixed(1)}-${hi.toFixed(1)}`;
    const count = values.filter(
      (v) => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)
    ).length;
    histogram.push({ bin: label, count });
  }

  return { columnName, mean, median, stdDev, min, max, histogram };
}

function computeChoiceFrequency(
  columnName: string,
  values: string[]
): ChoiceFrequency {
  const freq: Record<string, number> = {};
  for (const v of values) {
    const trimmed = v.trim();
    if (trimmed) {
      freq[trimmed] = (freq[trimmed] || 0) + 1;
    }
  }

  const total = values.length;
  const choices = Object.entries(freq)
    .map(([value, count]) => ({
      value,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  return { columnName, choices };
}

export function runQuantitativeAnalysis(
  input: QuantitativeInput
): QuantitativeResult {
  const { rows, columnTypes, sentimentMap } = input;

  const scoreDistributions: ScoreDistribution[] = [];
  const choiceFrequencies: ChoiceFrequency[] = [];
  const segmentAnalyses: SegmentAnalysis[] = [];

  const columns = Object.keys(columnTypes);

  for (const col of columns) {
    const type = columnTypes[col];

    if (type === 'score') {
      const nums = rows
        .map((r) => parseNumber(r[col]))
        .filter((n): n is number => n !== null);
      if (nums.length > 0) {
        scoreDistributions.push(computeScoreDistribution(col, nums));
      }
    }

    if (type === 'choice') {
      const vals = rows.map((r) => r[col] ?? '');
      choiceFrequencies.push(computeChoiceFrequency(col, vals));
    }

    if (type === 'meta' && sentimentMap) {
      // Use meta columns as segment dimensions
      const segmentValues = new Set(rows.map((r) => r[col]?.trim()).filter(Boolean));
      if (segmentValues.size > 0 && segmentValues.size <= 20) {
        const segments: SegmentAnalysis['segments'] = [];

        for (const segVal of segmentValues) {
          const segRows = rows.filter((r) => r[col]?.trim() === segVal);
          const sentimentBreakdown: Record<Sentiment, number> = {
            positive: 0,
            enthusiastic: 0,
            constructive_negative: 0,
            frustrated: 0,
            neutral: 0,
            mixed: 0,
          };

          for (const row of segRows) {
            const rowId = row['id'] ?? row['ID'] ?? '';
            const sentiment = sentimentMap[rowId];
            if (sentiment) {
              sentimentBreakdown[sentiment]++;
            }
          }

          // Find a score column for average
          const scoreCol = columns.find((c) => columnTypes[c] === 'score');
          let avgScore: number | undefined;
          if (scoreCol) {
            const nums = segRows
              .map((r) => parseNumber(r[scoreCol]))
              .filter((n): n is number => n !== null);
            if (nums.length > 0) {
              avgScore = nums.reduce((s, v) => s + v, 0) / nums.length;
            }
          }

          segments.push({
            segmentValue: segVal,
            respondentCount: segRows.length,
            sentimentBreakdown,
            avgScore,
          });
        }

        segmentAnalyses.push({
          segmentColumn: col,
          segments: segments.sort((a, b) => b.respondentCount - a.respondentCount),
        });
      }
    }
  }

  return {
    scoreDistributions,
    choiceFrequencies,
    segmentAnalyses,
    totalRespondents: rows.length,
  };
}
