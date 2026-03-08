'use client';

import { useState, useEffect, useRef } from 'react';

interface AnalysisStage {
  id: string;
  label: string;
  description: string;
}

export interface StageProgress {
  detail?: string;
  completed?: number;
  total?: number;
}

interface AnalysisProgressProps {
  currentStage: string;
  completedStages: string[];
  stageProgress?: Record<string, StageProgress>;
  stageStartTimes?: Record<string, number>;
  stageDurations?: Record<string, number>;
}

const STAGES: AnalysisStage[] = [
  { id: 'classify', label: '분류', description: '응답 데이터를 카테고리별로 분류하고 있습니다' },
  { id: 'user_advocate', label: '유저 관점 분석', description: '유저 옹호자 에이전트가 핵심 불만과 매력 요소를 분석합니다' },
  { id: 'design_advocate', label: '기획 관점 분석', description: '기획 옹호자 에이전트가 방향성 갭을 분석합니다' },
  { id: 'synthesis', label: '종합', description: '종합 판관 에이전트가 최종 결론을 도출합니다' },
];

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}분 ${remainSeconds}초`;
}

function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      setElapsed(Date.now() - startTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startTime]);

  return (
    <span className="ml-2 tabular-nums text-xs text-text-lt">
      {formatElapsed(elapsed)}
    </span>
  );
}

export default function AnalysisProgress({
  currentStage,
  completedStages,
  stageProgress,
  stageStartTimes,
  stageDurations,
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
          const progress = stageProgress?.[stage.id];
          const startTime = stageStartTimes?.[stage.id];
          const duration = stageDurations?.[stage.id];

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
                <div className="flex items-center">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-accent1' : isCompleted ? 'text-success' : 'text-text-lt'
                    }`}
                  >
                    {isCurrent ? `${stage.label} 중...` : isCompleted ? `${stage.label} 완료` : stage.label}
                  </p>

                  {/* Elapsed time for current stage */}
                  {isCurrent && startTime && (
                    <ElapsedTimer startTime={startTime} />
                  )}

                  {/* Duration for completed stage */}
                  {isCompleted && duration != null && (
                    <span className="ml-2 text-xs text-success/70">
                      ({formatElapsed(duration)})
                    </span>
                  )}
                </div>

                <p className={`mt-0.5 text-xs ${isPending ? 'text-text-lt/60' : 'text-text-lt'}`}>
                  {stage.description}
                </p>

                {/* Batch progress bar for classify stage */}
                {isCurrent && progress?.total && progress.total > 0 && (
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs text-text-lt">
                      <span>{progress.detail}</span>
                      <span>{Math.round(((progress.completed ?? 0) / progress.total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                      <div
                        className="h-full rounded-full bg-accent1/60 transition-all duration-300"
                        style={{ width: `${((progress.completed ?? 0) / progress.total) * 100}%` }}
                      />
                    </div>
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
