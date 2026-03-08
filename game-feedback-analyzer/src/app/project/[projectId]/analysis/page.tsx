'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RadarChart from '@/components/dashboard/RadarChart';
import KeywordBarChart from '@/components/dashboard/KeywordBarChart';
import TrendLineChart from '@/components/dashboard/TrendLineChart';
import ComparisonTable from '@/components/dashboard/ComparisonTable';
import CrossAnalysisChart from '@/components/dashboard/CrossAnalysisChart';
import SegmentTable from '@/components/dashboard/SegmentTable';
import IssueTracker from '@/components/dashboard/IssueTracker';
import QuoteCard from '@/components/dashboard/QuoteCard';
import DirectionMatchTable from '@/components/dashboard/DirectionMatchTable';
import ChecklistSection from '@/components/dashboard/ChecklistSection';
import AnalysisProgress from '@/components/dashboard/AnalysisProgress';
import type { StageProgress } from '@/components/dashboard/AnalysisProgress';
import type {
  AnalysisLevel,
  Sentiment,
  ClassificationResult,
  UserAdvocateResult,
  DesignAdvocateResult,
  SynthesisResult,
  CrossBuildResult,
  KeywordBarData,
  TrendLineData,
  RadarChartData,
} from '@/types';
import type { IssueRow } from '@/components/dashboard/IssueTracker';
import type { SegmentRow } from '@/components/dashboard/SegmentTable';
import type { ChecklistItem } from '@/components/dashboard/ChecklistSection';

const TABS = [
  { id: 'overview', label: '종합 개요' },
  { id: 'builds', label: '빌드별 상세' },
  { id: 'deep', label: '심층 분석' },
  { id: 'issues', label: '이슈 트래커' },
  { id: 'direction', label: '방향성 매칭' },
  { id: 'actions', label: '액션 아이템' },
];

interface Build {
  id: string;
  name: string;
  version: string | null;
  date: string;
  _count: { responses: number; feedbackFiles: number };
  analysis: { id: string; analysisLevel: string; analyzedAt: string } | null;
}

interface BuildDetail {
  id: string;
  name: string;
  version: string | null;
  analysis: {
    qualitativeJson: string | null;
    analysisLevel: string;
  } | null;
  responses: Array<{
    id: string;
    text: string;
    sentiment: string | null;
    categories: string | null;
    confidence: number | null;
    isKeyQuote: boolean;
  }>;
  taskHistories: Array<{
    status: string;
    task: {
      id: string;
      title: string;
      priority: string;
      currentStatus: string;
      section: string | null;
    };
  }>;
}

interface QualitativeResult {
  classification: ClassificationResult;
  userAdvocate?: UserAdvocateResult;
  designAdvocate?: DesignAdvocateResult;
  synthesis?: SynthesisResult;
}

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [activeTab, setActiveTab] = useState('overview');
  const [builds, setBuilds] = useState<Build[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string>('');
  const [buildDetail, setBuildDetail] = useState<BuildDetail | null>(null);
  const [analysisData, setAnalysisData] = useState<QualitativeResult | null>(null);
  const [crossBuildData, setCrossBuildData] = useState<CrossBuildResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisLevel, setAnalysisLevel] = useState<AnalysisLevel>('standard');
  const [analysisStage, setAnalysisStage] = useState('');
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [stageProgress, setStageProgress] = useState<Record<string, StageProgress>>({});
  const [stageStartTimes, setStageStartTimes] = useState<Record<string, number>>({});
  const [stageDurations, setStageDurations] = useState<Record<string, number>>({});
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch builds list
  useEffect(() => {
    async function fetchBuilds() {
      try {
        const res = await fetch(`/api/builds?projectId=${projectId}`);
        if (res.ok) {
          const data: Build[] = await res.json();
          setBuilds(data);
          if (data.length > 0 && !selectedBuildId) {
            setSelectedBuildId(data[data.length - 1].id);
          }
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }
    fetchBuilds();
  }, [projectId, selectedBuildId]);

  // Fetch build detail when selected build changes
  const fetchBuildDetail = useCallback(async (buildId: string) => {
    try {
      const res = await fetch(`/api/builds/${buildId}`);
      if (res.ok) {
        const data: BuildDetail = await res.json();
        setBuildDetail(data);

        if (data.analysis?.qualitativeJson) {
          const parsed: QualitativeResult = JSON.parse(data.analysis.qualitativeJson);
          setAnalysisData(parsed);
        } else {
          setAnalysisData(null);
        }
      }
    } catch {
      // Silently handle fetch errors
    }
  }, []);

  useEffect(() => {
    if (selectedBuildId) {
      fetchBuildDetail(selectedBuildId);
    }
  }, [selectedBuildId, fetchBuildDetail]);

  // Fetch cross-build analysis
  useEffect(() => {
    async function fetchCrossAnalysis() {
      try {
        const res = await fetch(`/api/analyze/cross-build?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.resultJson) {
            setCrossBuildData(JSON.parse(data.resultJson));
          }
        }
      } catch {
        // Silently handle
      }
    }
    fetchCrossAnalysis();
  }, [projectId]);

  // Start analysis via SSE streaming
  const handleStartAnalysis = async () => {
    if (!selectedBuildId) return;
    setAnalyzing(true);
    setCompletedStages([]);
    setStageProgress({});
    setStageStartTimes({});
    setStageDurations({});
    setAnalysisStage('');
    setAnalysisError(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch('/api/analyze/qualitative/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId: selectedBuildId, level: analysisLevel }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        setAnalysisError('분석 시작에 실패했습니다.');
        setAnalyzing(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.stage === 'done' && event.result) {
              setAnalysisData(event.result);
              setAnalysisStage('');
              await fetchBuildDetail(selectedBuildId);
              continue;
            }

            if (event.stage === 'error') {
              setAnalysisError(event.detail ?? '분석 중 오류가 발생했습니다.');
              continue;
            }

            if (event.status === 'started') {
              setAnalysisStage(event.stage);
              setStageStartTimes((prev) => ({ ...prev, [event.stage]: Date.now() }));
            }

            if (event.status === 'progress') {
              setStageProgress((prev) => ({
                ...prev,
                [event.stage]: {
                  detail: event.detail,
                  completed: event.completed,
                  total: event.total,
                },
              }));
            }

            if (event.status === 'completed') {
              setCompletedStages((prev) =>
                prev.includes(event.stage) ? prev : [...prev, event.stage]
              );
              setStageStartTimes((prev) => {
                const startTime = prev[event.stage];
                if (startTime) {
                  setStageDurations((d) => ({ ...d, [event.stage]: Date.now() - startTime }));
                }
                return prev;
              });
              // Clear current stage if it matches
              setAnalysisStage((cur) => (cur === event.stage ? '' : cur));
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setAnalysisError('네트워크 오류가 발생했습니다.');
      }
    } finally {
      setAnalyzing(false);
      abortRef.current = null;
    }
  };

  // Derive chart data from analysis
  const radarData: RadarChartData | null = analysisData
    ? deriveRadarData(analysisData, buildDetail?.name ?? '')
    : null;

  const keywordBarData: KeywordBarData[] = analysisData
    ? deriveKeywordBarData(analysisData)
    : [];

  const keyQuotes = buildDetail?.responses
    .filter((r) => r.isKeyQuote)
    .map((r) => ({
      quote: r.text,
      sentiment: (r.sentiment ?? 'neutral') as Sentiment,
      categories: r.categories ? (JSON.parse(r.categories) as string[]) : [],
      respondentId: r.id.slice(0, 8),
    })) ?? [];

  const issueRows: IssueRow[] = buildDetail?.taskHistories.map((th) => ({
    id: th.task.id.slice(0, 8),
    title: th.task.title,
    status: th.status as IssueRow['status'],
    priority: th.task.priority as IssueRow['priority'],
    category: th.task.section ?? '',
    assignedBuild: buildDetail.name,
    lastUpdated: new Date().toISOString().slice(0, 10),
  })) ?? [];

  const checklistItems: ChecklistItem[] = buildDetail?.taskHistories.map((th) => ({
    id: th.task.id.slice(0, 8),
    title: th.task.title,
    description: '',
    priority: th.task.priority as ChecklistItem['priority'],
    category: th.task.section ?? '',
    completed: th.status === 'resolved',
  })) ?? [];

  // Segment data from classification
  const segmentData: SegmentRow[] = analysisData
    ? deriveSegmentData(analysisData)
    : [];

  const trendLineData: TrendLineData[] = crossBuildData?.keywordTrends.map((kt) => ({
    keyword: kt.keyword,
    points: kt.buildValues.map((bv) => ({
      buildName: builds.find((b) => b.id === bv.buildId)?.name ?? bv.buildId,
      ratio: bv.ratio,
      confidenceLow: bv.confidenceInterval[0],
      confidenceHigh: bv.confidenceInterval[1],
    })),
  })) ?? [];

  const totalResponses = buildDetail?.responses.length ?? 0;
  const sentimentCounts = buildDetail?.responses.reduce(
    (acc, r) => {
      const s = (r.sentiment ?? 'neutral') as Sentiment;
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<Sentiment, number>
  ) ?? {} as Record<Sentiment, number>;

  const positiveCount = (sentimentCounts.positive ?? 0) + (sentimentCounts.enthusiastic ?? 0);
  const negativeCount = (sentimentCounts.constructive_negative ?? 0) + (sentimentCounts.frustrated ?? 0);
  const sentimentRatio = totalResponses > 0
    ? Math.round((positiveCount / totalResponses) * 100)
    : 0;

  const avgConfidence = buildDetail?.responses.length
    ? Math.round(
        (buildDetail.responses.reduce((sum, r) => sum + (r.confidence ?? 0), 0) /
          buildDetail.responses.length) *
          100
      )
    : 0;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-text-lt">로딩 중...</p>
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-text-mid">등록된 빌드가 없습니다.</p>
        <p className="text-sm text-text-lt">빌드를 추가하고 피드백을 업로드한 후 분석을 시작하세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text">분석 대시보드</h1>
        <div className="flex items-center gap-3">
          {/* Build selector */}
          <Select value={selectedBuildId} onValueChange={(v) => { if (v) setSelectedBuildId(v); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="빌드 선택" />
            </SelectTrigger>
            <SelectContent>
              {builds.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                  {b.analysis ? ' (분석 완료)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Analysis level */}
          <Select
            value={analysisLevel}
            onValueChange={(v) => { if (v) setAnalysisLevel(v as AnalysisLevel); }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">빠른 분석</SelectItem>
              <SelectItem value="standard">표준 분석</SelectItem>
              <SelectItem value="deep">심층 분석</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleStartAnalysis} disabled={analyzing || !selectedBuildId}>
            {analyzing ? '분석 중...' : '분석 시작'}
          </Button>
        </div>
      </div>

      {/* Analysis Progress */}
      {analyzing && (
        <AnalysisProgress
          currentStage={analysisStage}
          completedStages={completedStages}
          stageProgress={stageProgress}
          stageStartTimes={stageStartTimes}
          stageDurations={stageDurations}
        />
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {analysisError}
        </div>
      )}

      {/* Tabs */}
      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key metric cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-text-lt">총 응답 수</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-text">{totalResponses}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-text-lt">긍정 비율</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-success">{sentimentRatio}%</p>
                  <p className="text-xs text-text-lt">
                    긍정 {positiveCount} / 부정 {negativeCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-text-lt">AI 신뢰도</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-accent1">{avgConfidence}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-text-lt">분석 수준</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">
                    {buildDetail?.analysis?.analysisLevel ?? '미분석'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Radar chart */}
            {radarData && <RadarChart data={radarData} />}

            {/* Key quotes */}
            {keyQuotes.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-text">핵심 인용구</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {keyQuotes.slice(0, 4).map((q, i) => (
                    <QuoteCard key={i} {...q} />
                  ))}
                </div>
              </div>
            )}

            {/* Synthesis consensus */}
            {analysisData?.synthesis && (
              <Card>
                <CardHeader>
                  <CardTitle>종합 합의 사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisData.synthesis.consensus.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                        <Badge variant={c.strength === 'strong' ? 'default' : 'outline'}>
                          {c.strength === 'strong' ? '강한 합의' : '보통 합의'}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-text">{c.issue}</p>
                          <p className="mt-1 text-xs text-text-lt">{c.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'builds' && (
          <div className="space-y-6">
            {/* Build comparison */}
            {crossBuildData?.beforeAfterTable && crossBuildData.beforeAfterTable.length > 0 && (
              <ComparisonTable data={crossBuildData.beforeAfterTable} />
            )}

            {/* Trend line chart */}
            {trendLineData.length > 0 && <TrendLineChart data={trendLineData} />}

            {builds.length > 0 && !crossBuildData && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-text-lt">
                    빌드 비교 분석이 아직 수행되지 않았습니다.
                  </p>
                  <p className="mt-1 text-sm text-text-lt">
                    2개 이상의 빌드에서 분석을 완료하면 비교 분석을 실행할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'deep' && (
          <div className="space-y-6">
            {keywordBarData.length > 0 && <KeywordBarChart data={keywordBarData} />}

            {crossBuildData?.perceptionEvolution &&
              crossBuildData.perceptionEvolution.length > 0 && (
                <CrossAnalysisChart data={crossBuildData.perceptionEvolution} />
              )}

            {segmentData.length > 0 && <SegmentTable data={segmentData} />}

            {!analysisData && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-text-lt">
                    분석 데이터가 없습니다. 분석을 먼저 실행해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-6">
            {issueRows.length > 0 ? (
              <IssueTracker issues={issueRows} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-text-lt">등록된 이슈가 없습니다.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'direction' && (
          <div className="space-y-6">
            {analysisData?.designAdvocate ? (
              <DirectionMatchTable
                directionGaps={analysisData.designAdvocate.directionGaps}
                directionConflicts={analysisData.designAdvocate.directionConflicts}
                wellDelivered={analysisData.designAdvocate.wellDelivered}
                identityAssessment={analysisData.designAdvocate.identityAssessment}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-text-lt">
                    방향성 분석 데이터가 없습니다. 표준 또는 심층 분석을 실행해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-6">
            {checklistItems.length > 0 ? (
              <ChecklistSection items={checklistItems} />
            ) : analysisData?.synthesis?.finalPriorityRanking ? (
              <ChecklistSection
                items={analysisData.synthesis.finalPriorityRanking.map((item) => ({
                  id: `PRI-${item.rank}`,
                  title: item.issue,
                  description: `우선순위 점수: ${item.score}`,
                  priority: item.rank <= 1 ? 'P0' as const : item.rank <= 2 ? 'P1' as const : 'P2' as const,
                  category: item.category,
                  completed: false,
                }))}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-text-lt">
                    액션 아이템이 없습니다. 분석 실행 후 태스크를 등록해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Helper functions to derive chart data from analysis =====

function deriveRadarData(data: QualitativeResult, buildName: string): RadarChartData {
  const summary = data.classification.categorySummary;
  const categories = Object.keys(summary);
  const maxCount = Math.max(...categories.map((c) => summary[c].count), 1);
  const values = categories.map((c) => Math.round((summary[c].count / maxCount) * 100));

  return { categories, values, buildName };
}

function deriveKeywordBarData(data: QualitativeResult): KeywordBarData[] {
  const summary = data.classification.categorySummary;
  return Object.entries(summary)
    .map(([keyword, info]) => ({
      keyword,
      count: info.count,
      sentiment: info.sentimentBreakdown,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function deriveSegmentData(data: QualitativeResult): SegmentRow[] {
  if (!data.userAdvocate) return [];

  const segments: SegmentRow[] = [];

  if (data.userAdvocate.criticalPainPoints.length > 0) {
    segments.push({
      segment: '불만 유저',
      responseCount: data.userAdvocate.criticalPainPoints.reduce(
        (sum, p) => sum + p.frequency,
        0
      ),
      topCategories: data.userAdvocate.criticalPainPoints
        .slice(0, 3)
        .map((p) => p.issue),
      dominantSentiment: 'frustrated',
      keyInsight: data.userAdvocate.criticalPainPoints[0]?.issue ?? '',
    });
  }

  if (data.userAdvocate.strongAttractions.length > 0) {
    segments.push({
      segment: '만족 유저',
      responseCount: data.userAdvocate.strongAttractions.length * 10,
      topCategories: data.userAdvocate.strongAttractions
        .slice(0, 3)
        .map((a) => a.element),
      dominantSentiment: 'positive',
      keyInsight: data.userAdvocate.strongAttractions[0]?.element ?? '',
    });
  }

  if (data.userAdvocate.churnRiskMoments.length > 0) {
    segments.push({
      segment: '이탈 위험 유저',
      responseCount: data.userAdvocate.churnRiskMoments.length * 5,
      topCategories: data.userAdvocate.churnRiskMoments
        .slice(0, 3)
        .map((m) => m.moment),
      dominantSentiment: 'constructive_negative',
      keyInsight: data.userAdvocate.churnRiskMoments[0]?.moment ?? '',
    });
  }

  return segments;
}
