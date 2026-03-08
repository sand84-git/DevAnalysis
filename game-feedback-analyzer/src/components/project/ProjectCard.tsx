'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Folder, GitBranch, ClipboardList, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
  latestBuildName?: string;
  buildCount: number;
  openTaskCount: number;
  className?: string;
  onDelete?: (id: string) => void;
}

export function ProjectCard({
  id,
  name,
  description,
  latestBuildName,
  buildCount,
  openTaskCount,
  className,
  onDelete,
}: ProjectCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShowDialog(false);
        onDelete?.(id);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Link
        href={`/project/${id}`}
        className={cn(
          'block rounded-[10px] border border-border bg-card p-6 transition-shadow hover:shadow-md relative group',
          className
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDialog(true);
          }}
          className="absolute top-3 right-3 rounded-md p-1.5 text-text-lt opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              &apos;{name}&apos; 프로젝트를 삭제하시겠습니까? 모든 빌드, 피드백,
              분석 데이터가 함께 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
