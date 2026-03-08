'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GitBranch,
  LayoutDashboard,
  Search,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  projectId: string;
}

const navItems = [
  { label: '빌드 타임라인', icon: GitBranch, path: '' },
  { label: '대시보드', icon: LayoutDashboard, path: '/analysis' },
  { label: '피드백 검색', icon: Search, path: '/search' },
  { label: '태스크 관리', icon: ClipboardList, path: '/tasks' },
  { label: '프로젝트 설정', icon: Settings, path: '/settings' },
];

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname();
  const basePath = `/project/${projectId}`;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-4 py-5">
        <Link
          href="/"
          className="text-sm font-medium text-text-lt hover:text-text-mid"
        >
          &larr; 프로젝트 목록
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map((item) => {
          const href = `${basePath}${item.path}`;
          const isActive =
            item.path === ''
              ? pathname === basePath
              : pathname.startsWith(href);

          return (
            <Link
              key={item.path}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent1/10 text-accent1'
                  : 'text-text-mid hover:bg-bg hover:text-text'
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
