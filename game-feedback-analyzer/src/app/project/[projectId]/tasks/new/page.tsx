'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskForm } from '@/components/tasks/TaskForm';
import type { Priority, TaskStatus } from '@/types';

export default function NewTaskPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    section: string;
    priority: Priority;
    status: TaskStatus;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId: params.projectId }),
      });
      if (res.ok) {
        const result = await res.json();
        router.push(
          `/project/${params.projectId}/tasks/${result.id}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-8 py-8">
      <h2 className="mb-6 text-xl font-bold">새 태스크</h2>
      <div className="max-w-2xl rounded-[10px] border border-border bg-card p-6">
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
