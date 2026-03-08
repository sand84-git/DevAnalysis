'use client';

interface AnalysisStage {
  id: string;
  label: string;
  description: string;
}

interface AnalysisProgressProps {
  currentStage: string;
  completedStages: string[];
  intermediateResults?: Record<string, string>;
}

const STAGES: AnalysisStage[] = [
  { id: 'classify', label: '분류 중...', description: '응답 데이터를 카테고리별로 분류하고 있습니다' },
  { id: 'user_advocate', label: '유저 관점 분석 중...', description: '유저 옹호자 에이전트가 핵심 불만과 매력 요소를 분석합니다' },
  { id: 'design_advocate', label: '기획 관점 분석 중...', description: '기획 옹호자 에이전트가 방향성 갭을 분석합니다' },
  { id: 'synthesis', label: '종합 중...', description: '종합 판관 에이전트가 최종 결론을 도출합니다' },
];

export default function AnalysisProgress({
  currentStage,
  completedStages,
  intermediateResults,
}: AnalysisProgressProps) {
  const totalStages = STAGES.length;
  const completedCount = completedStages.length;
  const progressPercent = (completedCount / totalStages) * 100;

  return (
    <div className="rounded-[10px] border border-border bg-card p-6">
      <h3 className="mb-2 font-display text-lg text-text">분석 진행 상황</h3>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="mb-1 flex justify-between text-xs text-text-lt">
          <span>{completedCount}/{totalStages} 단계 완료</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full bg-accent1 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-4">
        {STAGES.map((stage) => {
          const isCompleted = completedStages.includes(stage.id);
          const isCurrent = currentStage === stage.id;
          const isPending = !isCompleted && !isCurrent;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
                isCurrent
                  ? 'border-accent1 bg-accent1/5'
                  : isCompleted
                  ? 'border-success/30 bg-success/5'
                  : 'border-border bg-transparent'
              }`}
            >
              {/* Status indicator */}
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                {isCompleted ? (
                  <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent1 border-t-transparent" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-border" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-accent1' : isCompleted ? 'text-success' : 'text-text-lt'
                  }`}
                >
                  {stage.label}
                </p>
                <p className={`mt-0.5 text-xs ${isPending ? 'text-text-lt/60' : 'text-text-lt'}`}>
                  {stage.description}
                </p>

                {/* Intermediate result */}
                {isCompleted && intermediateResults?.[stage.id] && (
                  <div className="mt-2 rounded bg-bg px-3 py-2">
                    <p className="text-xs text-text-mid">
                      {intermediateResults[stage.id]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
