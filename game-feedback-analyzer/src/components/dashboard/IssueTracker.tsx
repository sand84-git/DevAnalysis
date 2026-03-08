'use client';

import type { TaskStatus, Priority } from '@/types';

interface IssueRow {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  category: string;
  assignedBuild: string;
  lastUpdated: string;
}

interface IssueTrackerProps {
  issues: IssueRow[];
}

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  open: { label: '미해결', className: 'bg-d-blue/20 text-d-blue' },
  improving: { label: '개선 중', className: 'bg-d-yellow/20 text-d-yellow' },
  resolved: { label: '해결됨', className: 'bg-d-green/20 text-d-green' },
  hold: { label: '보류', className: 'bg-dark-sub/20 text-dark-sub' },
  worsened: { label: '악화', className: 'bg-d-red/20 text-d-red' },
};

const PRIORITY_STYLES: Record<Priority, { label: string; className: string }> = {
  P0: { label: 'P0', className: 'bg-d-red text-dark-bg font-bold' },
  P1: { label: 'P1', className: 'bg-d-yellow text-dark-bg font-bold' },
  P2: { label: 'P2', className: 'bg-d-blue text-dark-bg' },
  discuss: { label: '논의', className: 'bg-d-purple text-dark-bg' },
};

export default function IssueTracker({ issues }: IssueTrackerProps) {
  return (
    <div className="rounded-[10px] border border-border bg-dark-bg p-6">
      <h3 className="mb-4 font-display text-lg text-dark-text">
        이슈 트래커
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-grid">
              <th className="py-2 text-left font-medium text-dark-sub">ID</th>
              <th className="py-2 text-left font-medium text-dark-sub">이슈</th>
              <th className="py-2 text-left font-medium text-dark-sub">상태</th>
              <th className="py-2 text-left font-medium text-dark-sub">우선순위</th>
              <th className="py-2 text-left font-medium text-dark-sub">카테고리</th>
              <th className="py-2 text-left font-medium text-dark-sub">빌드</th>
              <th className="py-2 text-left font-medium text-dark-sub">업데이트</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const statusStyle = STATUS_STYLES[issue.status];
              const priorityStyle = PRIORITY_STYLES[issue.priority];
              return (
                <tr key={issue.id} className="border-b border-dark-grid/50">
                  <td className="py-3 font-mono text-xs text-dark-sub">
                    {issue.id}
                  </td>
                  <td className="py-3 font-medium text-dark-text">
                    {issue.title}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${statusStyle.className}`}
                    >
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${priorityStyle.className}`}
                    >
                      {priorityStyle.label}
                    </span>
                  </td>
                  <td className="py-3 text-dark-sub">{issue.category}</td>
                  <td className="py-3 text-dark-sub">{issue.assignedBuild}</td>
                  <td className="py-3 text-xs text-dark-sub">
                    {issue.lastUpdated}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { IssueRow };
