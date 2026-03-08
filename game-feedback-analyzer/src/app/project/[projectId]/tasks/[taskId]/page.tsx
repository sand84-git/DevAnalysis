'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { TaskTimeline } from '@/components/tasks/TaskTimeline';
import { TaskEvaluation as TaskEvaluationComponent } from '@/components/tasks/TaskEvaluation';
import type {
  TaskStatus,
  Priority,
  TaskEvaluation as TaskEvaluationType,
} from '@/types';

interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  section?: string;
  currentStatus: TaskStatus;
  priority: Priority;
  histories: Array<{
    buildId: string;
    buildName: string;
    status: TaskStatus;
    note?: string | null;
  }>;
  evaluation?: TaskEvaluationType;
}

const priorityLabels: Record<Priority, string> = {
  P0: 'P0 - 긴급',
  P1: 'P1 - 중요',
  P2: 'P2 - 보통',
  discuss: '논의 필요',
};

export default function TaskDetailPage() {
  const params = useParams<{ projectId: string; taskId: string }>();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `/api/projects/${params.projectId}/tasks/${params.taskId}`
    )
      .then((res) => res.json())
      .then((data) => setTask(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.projectId, params.taskId]);

  if (loading) {
    return (
      <div className="px-8 py-8 text-sm text-text-lt">불러오는 중...</div>
    );
  }

  if (!task) {
    return (
      <div className="px-8 py-8 text-sm text-text-lt">
        태스크를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{task.title}</h2>
          <TaskStatusBadge status={task.currentStatus} />
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm text-text-lt">
          <span>{priorityLabels[task.priority]}</span>
          {task.section && (
            <>
              <span>&middot;</span>
              <span>{task.section}</span>
            </>
          )}
        </div>
      </div>

      {task.description && (
        <div className="mb-6 rounded-[10px] border border-border bg-card p-6">
          <h3 className="mb-2 text-sm font-display font-bold text-text">
            설명
          </h3>
          <p className="text-sm leading-relaxed text-text-mid">
            {task.description}
          </p>
        </div>
      )}

      <div className="mb-6 rounded-[10px] border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-display font-bold text-text">
          빌드별 상태 변화
        </h3>
        <TaskTimeline entries={task.histories ?? []} />
      </div>

      {task.evaluation && (
        <TaskEvaluationComponent evaluation={task.evaluation} />
      )}
    </div>
  );
}
