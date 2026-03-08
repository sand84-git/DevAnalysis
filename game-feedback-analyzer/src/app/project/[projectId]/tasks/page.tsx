'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import type { TaskStatus, Priority } from '@/types';

interface TaskItem {
  id: string;
  title: string;
  section?: string | null;
  priority: Priority;
  currentStatus: TaskStatus;
}

export default function TasksPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tasks?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">태스크 관리</h2>
        <Link href={`/project/${projectId}/tasks/new`}>
          <Button>
            <Plus className="size-4" />
            새 태스크
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-text-lt">
          불러오는 중...
        </div>
      ) : (
        <TaskBoard projectId={projectId} tasks={tasks} />
      )}
    </div>
  );
}
