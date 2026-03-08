import type {
  RadarChartData,
  TrendLineData,
  KeywordBarData,
  CrossBuildResult,
  SynthesisResult,
  DesignAdvocateResult,
  Sentiment,
} from '@/types';
import type { SegmentRow } from './SegmentTable';
import type { IssueRow } from './IssueTracker';
import type { ChecklistItem } from './ChecklistSection';

// ===== Radar Chart =====
export const mockRadarData: RadarChartData = {
  categories: ['전투', '그래픽', 'UI/UX', '스토리', '밸런스', '콘텐츠'],
  values: [72, 85, 45, 68, 38, 60],
  buildName: 'Build 0.9.2',
};

// ===== Keyword Bar Chart =====
export const mockKeywordBarData: KeywordBarData[] = [
  {
    keyword: '전투감',
    count: 45,
    sentiment: { positive: 20, enthusiastic: 10, constructive_negative: 8, frustrated: 3, neutral: 2, mixed: 2 },
  },
  {
    keyword: '밸런스',
    count: 38,
    sentiment: { positive: 5, enthusiastic: 2, constructive_negative: 15, frustrated: 12, neutral: 2, mixed: 2 },
  },
  {
    keyword: 'UI 반응속도',
    count: 32,
    sentiment: { positive: 3, enthusiastic: 1, constructive_negative: 18, frustrated: 8, neutral: 1, mixed: 1 },
  },
  {
    keyword: '그래픽 퀄리티',
    count: 28,
    sentiment: { positive: 18, enthusiastic: 6, constructive_negative: 2, frustrated: 0, neutral: 1, mixed: 1 },
  },
  {
    keyword: '튜토리얼',
    count: 22,
    sentiment: { positive: 4, enthusiastic: 1, constructive_negative: 10, frustrated: 5, neutral: 1, mixed: 1 },
  },
];

// ===== Trend Line Chart =====
export const mockTrendLineData: TrendLineData[] = [
  {
    keyword: '전투감',
    points: [
      { buildName: '0.8.0', ratio: 0.45, confidenceLow: 0.38, confidenceHigh: 0.52 },
      { buildName: '0.8.5', ratio: 0.52, confidenceLow: 0.45, confidenceHigh: 0.59 },
      { buildName: '0.9.0', ratio: 0.65, confidenceLow: 0.58, confidenceHigh: 0.72 },
      { buildName: '0.9.2', ratio: 0.72, confidenceLow: 0.65, confidenceHigh: 0.79 },
    ],
  },
  {
    keyword: '밸런스',
    points: [
      { buildName: '0.8.0', ratio: 0.6, confidenceLow: 0.52, confidenceHigh: 0.68 },
      { buildName: '0.8.5', ratio: 0.5, confidenceLow: 0.42, confidenceHigh: 0.58 },
      { buildName: '0.9.0', ratio: 0.42, confidenceLow: 0.34, confidenceHigh: 0.5 },
      { buildName: '0.9.2', ratio: 0.38, confidenceLow: 0.3, confidenceHigh: 0.46 },
    ],
  },
  {
    keyword: 'UI',
    points: [
      { buildName: '0.8.0', ratio: 0.3, confidenceLow: 0.22, confidenceHigh: 0.38 },
      { buildName: '0.8.5', ratio: 0.35, confidenceLow: 0.27, confidenceHigh: 0.43 },
      { buildName: '0.9.0', ratio: 0.4, confidenceLow: 0.32, confidenceHigh: 0.48 },
      { buildName: '0.9.2', ratio: 0.45, confidenceLow: 0.37, confidenceHigh: 0.53 },
    ],
  },
];

// ===== Comparison Table =====
export const mockBeforeAfterData: CrossBuildResult['beforeAfterTable'] = [
  {
    area: '전투 시스템',
    builds: [
      { buildId: '0.8.5', description: '기본 히트 판정 개선', trend: 'improved', confidence: 0.82 },
      { buildId: '0.9.0', description: '콤보 시스템 추가', trend: 'improved', confidence: 0.91 },
      { buildId: '0.9.2', description: '이펙트 강화', trend: 'improved', confidence: 0.88 },
    ],
  },
  {
    area: '밸런스',
    builds: [
      { buildId: '0.8.5', description: '캐릭터 스탯 조정', trend: 'stagnant', confidence: 0.65 },
      { buildId: '0.9.0', description: '난이도 하향', trend: 'worsened', confidence: 0.78 },
      { buildId: '0.9.2', description: '추가 조정 없음', trend: 'worsened', confidence: 0.72 },
    ],
  },
  {
    area: 'UI/UX',
    builds: [
      { buildId: '0.8.5', description: '메뉴 구조 변경', trend: 'stagnant', confidence: 0.55 },
      { buildId: '0.9.0', description: '인벤토리 개편', trend: 'improved', confidence: 0.7 },
      { buildId: '0.9.2', description: '반응속도 최적화', trend: 'improved', confidence: 0.85 },
    ],
  },
];

// ===== Cross Analysis (Perception Evolution) =====
export const mockPerceptionEvolution: CrossBuildResult['perceptionEvolution'] = [
  { buildId: '0.8.0', keywords: ['투박한', '기본적', '잠재력'] },
  { buildId: '0.8.5', keywords: ['개선된', '기본적', '밸런스 문제'] },
  { buildId: '0.9.0', keywords: ['타격감 좋은', '밸런스 붕괴', 'UI 개선'] },
  { buildId: '0.9.2', keywords: ['완성도 높은', '밸런스 심각', '그래픽 수준급'] },
];

// ===== Segment Table =====
export const mockSegmentData: SegmentRow[] = [
  {
    segment: '하드코어 게이머',
    responseCount: 45,
    topCategories: ['밸런스', '전투', '콘텐츠'],
    dominantSentiment: 'constructive_negative',
    keyInsight: '밸런스 문제에 민감, 전투 시스템에는 높은 만족도',
  },
  {
    segment: '캐주얼 게이머',
    responseCount: 62,
    topCategories: ['UI/UX', '튜토리얼', '그래픽'],
    dominantSentiment: 'positive',
    keyInsight: '비주얼에 만족하지만 진입장벽을 느낌',
  },
  {
    segment: '복귀 유저',
    responseCount: 18,
    topCategories: ['콘텐츠', '변경사항', '밸런스'],
    dominantSentiment: 'mixed',
    keyInsight: '변경사항에 혼란, 콘텐츠 업데이트에는 긍정적',
  },
];

// ===== Issue Tracker =====
export const mockIssues: IssueRow[] = [
  { id: 'ISS-001', title: '보스 밸런스 급격한 난이도 상승', status: 'open', priority: 'P0', category: '밸런스', assignedBuild: '0.9.3', lastUpdated: '2026-03-05' },
  { id: 'ISS-002', title: 'PvP 캐릭터 간 격차 심화', status: 'worsened', priority: 'P0', category: '밸런스', assignedBuild: '0.9.3', lastUpdated: '2026-03-04' },
  { id: 'ISS-003', title: '인벤토리 정렬 기능 부재', status: 'improving', priority: 'P1', category: 'UI/UX', assignedBuild: '0.9.2', lastUpdated: '2026-03-03' },
  { id: 'ISS-004', title: '튜토리얼 스킵 불가', status: 'resolved', priority: 'P1', category: 'UI/UX', assignedBuild: '0.9.1', lastUpdated: '2026-02-28' },
  { id: 'ISS-005', title: '엔드게임 콘텐츠 부족', status: 'open', priority: 'P2', category: '콘텐츠', assignedBuild: '1.0.0', lastUpdated: '2026-03-06' },
  { id: 'ISS-006', title: '사운드 볼륨 설정 저장 안됨', status: 'hold', priority: 'P2', category: 'UI/UX', assignedBuild: '-', lastUpdated: '2026-02-20' },
];

// ===== Direction Match =====
export const mockDirectionGaps: DesignAdvocateResult['directionGaps'] = [
  {
    area: '전투 난이도',
    intended: '도전적이지만 공정한 난이도',
    actual: '불공정하고 좌절감을 주는 난이도',
    gapType: 'delivery_failure',
    evidence: ['보스 패턴 랜덤성 지적', '체감 난이도 급상승 구간'],
  },
  {
    area: '성장 시스템',
    intended: '다양한 빌드 선택지',
    actual: '최적 빌드 1-2개로 수렴',
    gapType: 'design_failure',
    evidence: ['특정 스킬 쏠림 현상', '비인기 스킬 사용률 2% 미만'],
  },
];

export const mockDirectionConflicts: DesignAdvocateResult['directionConflicts'] = [
  {
    userDemand: '자동 전투 기능 추가',
    designDirection: '수동 조작의 재미를 핵심 경험으로 유지',
    recommendation: '반복 콘텐츠에 한해 제한적 자동화 도입 검토',
  },
];

export const mockWellDelivered: DesignAdvocateResult['wellDelivered'] = [
  { element: '아트 스타일', evidence: ['그래픽 수준급이라는 반응', '캐릭터 디자인 호평'] },
  { element: '타격감', evidence: ['전투가 재미있다는 의견 다수', '이펙트 강화 후 만족도 상승'] },
];

// ===== Synthesis =====
export const mockSynthesisData: SynthesisResult = {
  consensus: [
    { issue: '밸런스 조정 시급', strength: 'strong', action: '다음 빌드에서 캐릭터/보스 밸런스 패치 우선 적용' },
    { issue: '전투 시스템 완성도 높음', strength: 'strong', action: '현재 방향 유지, 콘텐츠 확장에 집중' },
    { issue: 'UI/UX 반응속도 개선 필요', strength: 'moderate', action: '인벤토리 및 메뉴 최적화' },
  ],
  conflicts: [
    {
      issue: '자동 전투 도입 여부',
      userPerspective: '반복 콘텐츠 피로도 높음, 자동화 필요',
      designPerspective: '수동 조작이 게임의 핵심 아이덴티티',
      aiRecommendation: '제한적 자동화 (반복 던전에 한해)',
      evidenceStrength: { user: 0.75, design: 0.85 },
    },
  ],
  blindSpots: [
    { source: 'user_advocate', insight: '소셜 기능에 대한 언급이 거의 없어 잠재 니즈 탐색 필요' },
    { source: 'design_advocate', insight: '경쟁 타이틀 대비 콘텐츠 갱신 주기 분석 부재' },
  ],
  finalPriorityRanking: [
    { issue: '밸런스 패치', rank: 1, score: 95, category: '밸런스' },
    { issue: 'UI 반응속도', rank: 2, score: 78, category: 'UI/UX' },
    { issue: '엔드게임 콘텐츠', rank: 3, score: 72, category: '콘텐츠' },
    { issue: '튜토리얼 개선', rank: 4, score: 65, category: 'UI/UX' },
  ],
};

// ===== Checklist =====
export const mockChecklist: ChecklistItem[] = [
  { id: 'ACT-001', title: '보스 밸런스 긴급 패치', description: '3장 보스 HP/공격력 하향, 패턴 예측 가능성 증가', priority: 'P0', category: '밸런스', completed: false },
  { id: 'ACT-002', title: 'PvP 캐릭터 밸런스 조정', description: '상위 3캐릭터 너프, 하위 5캐릭터 버프', priority: 'P0', category: '밸런스', completed: false },
  { id: 'ACT-003', title: '인벤토리 정렬 기능 추가', description: '등급/종류/최근순 정렬 옵션', priority: 'P1', category: 'UI/UX', completed: true },
  { id: 'ACT-004', title: 'UI 반응속도 최적화', description: '메뉴 전환 0.3초 이내 목표', priority: 'P1', category: 'UI/UX', completed: false },
  { id: 'ACT-005', title: '엔드게임 콘텐츠 로드맵 작성', description: '1.0 출시 전 최소 2개 엔드게임 모드 확정', priority: 'P2', category: '콘텐츠', completed: false },
  { id: 'ACT-006', title: '자동 전투 도입 범위 논의', description: '기획팀 내부 토론 후 방향 결정', priority: 'discuss', category: '전투', completed: false },
];

// ===== Key Quotes =====
export const mockQuotes: Array<{ quote: string; sentiment: Sentiment; categories: string[]; respondentId?: string }> = [
  { quote: '전투 자체는 정말 재미있는데, 보스전에서 갑자기 난이도가 미쳐버려요. 패턴 외우기 게임이 되는 느낌.', sentiment: 'constructive_negative', categories: ['전투', '밸런스'], respondentId: 'R-042' },
  { quote: '그래픽이 이 장르에서 본 것 중 최고 수준입니다. 특히 이펙트가 정말 화려해요.', sentiment: 'enthusiastic', categories: ['그래픽'], respondentId: 'R-018' },
  { quote: '인벤토리가 왜 정렬이 안 되는 건지... 아이템 100개 넘으면 찾기가 불가능해요.', sentiment: 'frustrated', categories: ['UI/UX'], respondentId: 'R-073' },
];
