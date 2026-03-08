'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProjectForm } from '@/components/project/ProjectForm';

interface ProjectData {
  name: string;
  description: string;
  directionDoc: string;
  categories: string[];
}

export default function ProjectSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        setProject({
          name: data.name ?? '',
          description: data.description ?? '',
          directionDoc: data.directionDoc ?? '',
          categories: data.categories?.map((c: { name: string }) => c.name) ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleSubmit = async (data: ProjectData) => {
    setIsSubmitting(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-8 py-8 text-sm text-text-lt">불러오는 중...</div>
    );
  }

  return (
    <div className="px-8 py-8">
      <h2 className="mb-6 text-xl font-bold">프로젝트 설정</h2>
      <div className="max-w-2xl rounded-[10px] border border-border bg-card p-6">
        {project && (
          <ProjectForm
            initialData={project}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        {saved && (
          <p className="mt-4 text-sm text-success">저장되었습니다.</p>
        )}
      </div>
    </div>
  );
}
