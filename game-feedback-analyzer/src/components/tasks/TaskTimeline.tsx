import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types';

const statusColors: Record<TaskStatus, string> = {
  open: 'bg-danger',
  improving: 'bg-warn',
  resolved: 'bg-success',
  hold: 'bg-text-lt',
  worsened: 'bg-accent1',
};

const statusLabels: Record<TaskStatus, string> = {
  open: '열림',
  improving: '개선 중',
  resolved: '해결됨',
  hold: '보류',
  worsened: '악화',
};

interface TimelineEntry {
  buildId: string;
  buildName: string;
  status: TaskStatus;
  note?: string | null;
}

interface TaskTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

export function TaskTimeline({ entries, className }: TaskTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-text-lt">아직 상태 변경 기록이 없습니다.</p>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <p className="mb-3 text-xs font-medium text-text-mid">빌드별 상태 변화</p>
      <div className="flex items-center gap-1">
        {entries.map((entry, i) => (
          <div key={entry.buildId} className="flex items-center gap-1">
            {i > 0 && (
              <div className="h-px w-4 bg-border" />
            )}
            <div className="group relative flex flex-col items-center">
              <div
                className={cn(
                  'size-4 rounded-full',
                  statusColors[entry.status]
                )}
              />
              <span className="mt-1 max-w-16 truncate text-center text-[10px] text-text-lt">
                {entry.buildName}
              </span>
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-md bg-text px-2 py-1 text-xs text-card shadow-md group-hover:block">
                <p className="font-medium">{statusLabels[entry.status]}</p>
                {entry.note && (
                  <p className="mt-0.5 text-text-lt">{entry.note}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
