'use client';

import type { CrossBuildResult } from '@/types';

interface ComparisonTableProps {
  data: CrossBuildResult['beforeAfterTable'];
}

const TREND_STYLES: Record<string, { label: string; className: string }> = {
  improved: { label: '개선', className: 'bg-success/20 text-success' },
  stagnant: { label: '정체', className: 'bg-warn/20 text-warn' },
  worsened: { label: '악화', className: 'bg-danger/20 text-danger' },
  unconfirmed: { label: '미확인', className: 'bg-text-lt/20 text-text-lt' },
};

export default function ComparisonTable({ data }: ComparisonTableProps) {
  if (data.length === 0) return null;

  const buildIds = data[0].builds.map((b) => b.buildId);

  return (
    <div className="rounded-[10px] border border-border bg-card p-6">
      <h3 className="mb-4 font-display text-lg text-text">
        Before / After 비교
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left font-medium text-text-mid">영역</th>
              {buildIds.map((id) => (
                <th key={id} className="py-2 text-left font-medium text-text-mid">
                  {id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.area} className="border-b border-border/50">
                <td className="py-3 font-medium text-text">{row.area}</td>
                {row.builds.map((build) => {
                  const style = TREND_STYLES[build.trend];
                  return (
                    <td key={build.buildId} className="py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
                        >
                          {style.label}
                        </span>
                        <span className="text-text-lt text-xs">
                          {Math.round(build.confidence * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-mid">
                        {build.description}
                      </p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
