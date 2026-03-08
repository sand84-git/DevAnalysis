'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/project/ProjectCard';

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  latestBuildName?: string;
  buildCount: number;
  openTaskCount: number;
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects ?? []);
      })
      .catch(() => {
        // API not yet implemented, show empty state
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <p className="mt-1 text-sm text-text-lt">
            게임 피드백 분석 프로젝트를 관리합니다
          </p>
        </div>
        <Link href="/project/new">
          <Button>
            <Plus className="size-4" />
            새 프로젝트
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-text-lt">
          불러오는 중...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-text-lt">
            아직 프로젝트가 없습니다.
          </p>
          <Link href="/project/new" className="mt-4 inline-block">
            <Button variant="outline">
              <Plus className="size-4" />
              첫 프로젝트 만들기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description}
              latestBuildName={project.latestBuildName}
              buildCount={project.buildCount}
              openTaskCount={project.openTaskCount}
              onDelete={(id) =>
                setProjects((prev) => prev.filter((p) => p.id !== id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
