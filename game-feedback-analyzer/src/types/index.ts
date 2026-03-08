// ===== 분석 레벨 =====
export type AnalysisLevel = 'quick' | 'standard' | 'deep';

// ===== 감정 6단계 =====
export type Sentiment =
  | 'positive'
  | 'enthusiastic'
  | 'constructive_negative'
  | 'frustrated'
  | 'neutral'
  | 'mixed';

// ===== 태스크 상태 =====
export type TaskStatus = 'open' | 'improving' | 'resolved' | 'hold' | 'worsened';

// ===== 우선순위 =====
export type Priority = 'P0' | 'P1' | 'P2' | 'discuss';

// ===== 테스트 유형 =====
export type TestType = 'field_test' | 'internal' | 'fgt' | 'cbt' | 'soft_launch' | 'other';

// ===== AI 분류 결과 (Agent 1 출력) =====
export interface ClassifiedResponse {
  id: string;
  text: string;
  language: string;
  categories: string[];
  sentiment: Sentiment;
  confidence: number;
  isKeyQuote: boolean;
  summary: string;
}

export interface ClassificationResult {
  classifiedResponses: ClassifiedResponse[];
  categorySummary: Record<string, {
    count: number;
    sentimentBreakdown: Record<Sentiment, number>;
    topQuotes: string[];
  }>;
  newCategorySuggestions: string[];
}

// ===== Agent 2 출력 (유저 옹호자) =====
export interface UserAdvocateResult {
  criticalPainPoints: Array<{
    issue: string;
    frequency: number;
    intensity: 'high' | 'medium' | 'low';
    quotes: string[];
  }>;
  hiddenFrustrations: Array<{
    issue: string;
    evidence: string[];
  }>;
  strongAttractions: Array<{
    element: string;
    quotes: string[];
  }>;
  churnRiskMoments: Array<{
    moment: string;
    severity: 'critical' | 'warning';
    quotes: string[];
  }>;
}

// ===== Agent 3 출력 (기획 옹호자) =====
export interface DesignAdvocateResult {
  directionGaps: Array<{
    area: string;
    intended: string;
    actual: string;
    gapType: 'design_failure' | 'delivery_failure';
    evidence: string[];
  }>;
  directionConflicts: Array<{
    userDemand: string;
    designDirection: string;
    recommendation: string;
  }>;
  wellDelivered: Array<{
    element: string;
    evidence: string[];
  }>;
  identityAssessment: 'strong' | 'partial' | 'weak';
}

// ===== Agent 4 출력 (종합 판관) =====
export interface SynthesisResult {
  consensus: Array<{
    issue: string;
    strength: 'strong' | 'moderate';
    action: string;
  }>;
  conflicts: Array<{
    issue: string;
    userPerspective: string;
    designPerspective: string;
    aiRecommendation: string;
    evidenceStrength: { user: number; design: number };
    userOverride?: { decision: string; reason: string };
  }>;
  blindSpots: Array<{
    source: 'user_advocate' | 'design_advocate';
    insight: string;
  }>;
  finalPriorityRanking: Array<{
    issue: string;
    rank: number;
    score: number;
    category: string;
  }>;
}

// ===== 빌드 비교 결과 =====
export interface CrossBuildResult {
  keywordTrends: Array<{
    keyword: string;
    buildValues: Array<{
      buildId: string;
      ratio: number;
      count: number;
      confidenceInterval: [number, number];
    }>;
  }>;
  beforeAfterTable: Array<{
    area: string;
    builds: Array<{
      buildId: string;
      description: string;
      trend: 'improved' | 'stagnant' | 'worsened' | 'unconfirmed';
      confidence: number;
    }>;
  }>;
  perceptionEvolution: Array<{
    buildId: string;
    keywords: string[];
  }>;
}

// ===== 태스크 평가 결과 =====
export interface TaskEvaluation {
  feedbackScore: number;
  reasoning: string;
  relatedQuotes: string[];
  priorityRecommendation: Priority;
  supplementSuggestion: string;
  historyInsight?: string;
  userAdvocateEval?: string;
  designAdvocateEval?: string;
  evaluationConsensus?: 'consensus' | 'conflict' | 'complement';
}

// ===== 비용 추적 =====
export interface CostEntry {
  agent: string;
  model: 'sonnet' | 'opus';
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUSD: number;
}

// ===== 대시보드 차트 데이터 =====
export interface RadarChartData {
  categories: string[];
  values: number[];
  buildName: string;
}

export interface TrendLineData {
  keyword: string;
  points: Array<{
    buildName: string;
    ratio: number;
    confidenceLow: number;
    confidenceHigh: number;
  }>;
}

export interface KeywordBarData {
  keyword: string;
  count: number;
  sentiment: Record<Sentiment, number>;
}

// ===== 컬럼 감지 =====
export type ColumnType = 'score' | 'choice' | 'open_text' | 'meta';

export interface DetectedColumn {
  name: string;
  type: ColumnType;
  sampleValues: string[];
}

// ===== 바이어스 프로파일 =====
export interface BiasProfile {
  expectedPositiveRatio: number;
  expectedNegativeRatio: number;
  biasType: string;
  description: string;
}

// ===== 신뢰도 지표 =====
export interface ReliabilityIndicator {
  sampleReliability: 'low' | 'medium' | 'high';
  sampleCount: number;
  aiConfidenceAvg: number;
  biasIndex: number;
}
