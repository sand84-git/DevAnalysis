'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BuildForm } from '@/components/build/BuildForm';

export default function NewBuildPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    version: string;
    date: string;
    testType: string;
    notes: string;
    changes: string;
    testTarget: string;
    testCount: string;
    playTime: string;
    caution: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId: params.projectId }),
      });
      if (res.ok) {
        const result = await res.json();
        router.push(
          `/project/${params.projectId}/builds/${result.id}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-8 py-8">
      <h2 className="mb-6 text-xl font-bold">새 빌드</h2>
      <div className="max-w-2xl rounded-[10px] border border-border bg-card p-6">
        <BuildForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
