import Link from 'next/link';
import { Folder, GitBranch, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
  latestBuildName?: string;
  buildCount: number;
  openTaskCount: number;
  className?: string;
}

export function ProjectCard({
  id,
  name,
  description,
  latestBuildName,
  buildCount,
  openTaskCount,
  className,
}: ProjectCardProps) {
  return (
    <Link
      href={`/project/${id}`}
      className={cn(
        'block rounded-[10px] border border-border bg-card p-6 transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent1/10">
          <Folder className="size-5 text-accent1" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-display font-bold text-text">
            {name}
          </h3>
          {description && (
            <p className="mt-0.5 truncate text-sm text-text-lt">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-lt">
        {latestBuildName && (
          <span className="flex items-center gap-1">
            <GitBranch className="size-3.5" />
            {latestBuildName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <GitBranch className="size-3.5" />
          빌드 {buildCount}개
        </span>
        <span className="flex items-center gap-1">
          <ClipboardList className="size-3.5" />
          태스크 {openTaskCount}개
        </span>
      </div>
    </Link>
  );
}
