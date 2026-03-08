'use client';

import Link from 'next/link';
import { TaskStatusBadge } from './TaskStatusBadge';
import { cn } from '@/lib/utils';
import type { TaskStatus, Priority } from '@/types';

interface TaskItem {
  id: string;
  title: string;
  section?: string | null;
  priority: Priority;
  currentStatus: TaskStatus;
}

const columns: { status: TaskStatus; label: string }[] = [
  { status: 'open', label: '열림' },
  { status: 'improving', label: '개선 중' },
  { status: 'resolved', label: '해결됨' },
  { status: 'hold', label: '보류' },
  { status: 'worsened', label: '악화' },
];

const priorityColors: Record<Priority, string> = {
  P0: 'border-l-danger',
  P1: 'border-l-accent1',
  P2: 'border-l-accent4',
  discuss: 'border-l-accent2',
};

interface TaskBoardProps {
  projectId: string;
  tasks: TaskItem[];
  className?: string;
}

export function TaskBoard({ projectId, tasks, className }: TaskBoardProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
        className
      )}
    >
      {columns.map((col) => {
        const columnTasks = tasks.filter(
          (t) => t.currentStatus === col.status
        );
        return (
          <div key={col.status} className="space-y-3">
            <div className="flex items-center gap-2">
              <TaskStatusBadge status={col.status} />
              <span className="text-xs text-text-lt">
                {columnTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {columnTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/project/${projectId}/tasks/${task.id}`}
                  className={cn(
                    'block rounded-lg border border-border border-l-[3px] bg-card p-3 transition-shadow hover:shadow-sm',
                    priorityColors[task.priority]
                  )}
                >
                  <p className="text-sm font-medium text-text">
                    {task.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-text-lt">
                    <span>{task.priority}</span>
                    {task.section && (
                      <>
                        <span>&middot;</span>
                        <span>{task.section}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
              {columnTasks.length === 0 && (
                <p className="py-4 text-center text-xs text-text-lt">
                  없음
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
