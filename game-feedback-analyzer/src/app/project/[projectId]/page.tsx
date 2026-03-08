'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BuildTimeline } from '@/components/build/BuildTimeline';

interface BuildItem {
  id: string;
  name: string;
  date: string;
  testType?: string | null;
  feedbackCount: number;
  analysisStatus: 'pending' | 'analyzing' | 'done' | 'error';
}

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [builds, setBuilds] = useState<BuildItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/builds`)
      .then((res) => res.json())
      .then((data) => {
        setBuilds(data.builds ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">빌드 타임라인</h2>
        <Link href={`/project/${projectId}/builds/new`}>
          <Button>
            <Plus className="size-4" />
            새 빌드
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-text-lt">
          불러오는 중...
        </div>
      ) : (
        <BuildTimeline projectId={projectId} builds={builds} />
      )}
    </div>
  );
}
