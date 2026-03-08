'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProjectForm } from '@/components/project/ProjectForm';

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    description: string;
    directionDoc: string;
    categories: string[];
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        router.push(`/project/${result.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">새 프로젝트</h1>
      <div className="rounded-[10px] border border-border bg-card p-6">
        <ProjectForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
