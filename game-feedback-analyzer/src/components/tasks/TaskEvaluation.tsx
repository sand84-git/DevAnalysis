import { cn } from '@/lib/utils';
import type { TaskEvaluation as TaskEvaluationType } from '@/types';

interface TaskEvaluationProps {
  evaluation: TaskEvaluationType;
  className?: string;
}

export function TaskEvaluation({
  evaluation,
  className,
}: TaskEvaluationProps) {
  const scoreColor =
    evaluation.feedbackScore >= 7
      ? 'text-success'
      : evaluation.feedbackScore >= 4
        ? 'text-warn'
        : 'text-danger';

  return (
    <div
      className={cn(
        'rounded-[10px] border border-border bg-card p-6 space-y-4',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <h4 className="font-display text-sm font-bold text-text">
          AI 평가 결과
        </h4>
        <div className="text-right">
          <span className={cn('text-2xl font-bold', scoreColor)}>
            {evaluation.feedbackScore}
          </span>
          <span className="text-sm text-text-lt">/10</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-mid">평가 근거</p>
        <p className="text-sm text-text-mid">{evaluation.reasoning}</p>
      </div>

      {evaluation.relatedQuotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-mid">관련 인용문</p>
          <ul className="space-y-1.5">
            {evaluation.relatedQuotes.map((quote, i) => (
              <li
                key={i}
                className="border-l-2 border-accent1/30 pl-3 text-sm italic text-text-lt"
              >
                &ldquo;{quote}&rdquo;
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs">
        <div>
          <span className="text-text-lt">우선순위 추천: </span>
          <span className="font-medium text-text">
            {evaluation.priorityRecommendation}
          </span>
        </div>
        {evaluation.evaluationConsensus && (
          <div>
            <span className="text-text-lt">합의: </span>
            <span className="font-medium text-text">
              {evaluation.evaluationConsensus === 'consensus'
                ? '합의'
                : evaluation.evaluationConsensus === 'conflict'
                  ? '갈등'
                  : '보완'}
            </span>
          </div>
        )}
      </div>

      {evaluation.supplementSuggestion && (
        <div className="rounded-lg bg-bg p-3">
          <p className="text-xs font-medium text-text-mid">보완 제안</p>
          <p className="mt-1 text-sm text-text-mid">
            {evaluation.supplementSuggestion}
          </p>
        </div>
      )}
    </div>
  );
}
