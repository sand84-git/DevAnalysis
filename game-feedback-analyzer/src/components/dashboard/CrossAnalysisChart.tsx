'use client';

import type { CrossBuildResult } from '@/types';

interface CrossAnalysisChartProps {
  data: CrossBuildResult['perceptionEvolution'];
}

const KEYWORD_COLORS = [
  'bg-d-red/80', 'bg-d-yellow/80', 'bg-d-blue/80',
  'bg-d-purple/80', 'bg-d-green/80',
];

export default function CrossAnalysisChart({ data }: CrossAnalysisChartProps) {
  // Gather all unique keywords to assign consistent colors
  const allKeywords = Array.from(
    new Set(data.flatMap((d) => d.keywords))
  );
  const keywordColorMap = new Map(
    allKeywords.map((kw, i) => [kw, KEYWORD_COLORS[i % KEYWORD_COLORS.length]])
  );

  return (
    <div className="rounded-[10px] border border-border bg-dark-bg p-6">
      <h3 className="mb-4 font-display text-lg text-dark-text">
        인식 변화 추이 (빌드별)
      </h3>
      <div className="space-y-4">
        {data.map((entry) => (
          <div key={entry.buildId} className="flex items-start gap-4">
            <div className="w-28 shrink-0 text-sm font-medium text-dark-sub">
              {entry.buildId}
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.keywords.map((kw) => (
                <span
                  key={kw}
                  className={`rounded-full px-3 py-1 text-xs font-medium text-dark-bg ${keywordColorMap.get(kw) ?? 'bg-dark-sub/80'}`}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-dark-grid pt-4">
        {allKeywords.map((kw) => (
          <div key={kw} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-3 w-3 rounded-full ${keywordColorMap.get(kw)}`}
            />
            <span className="text-xs text-dark-sub">{kw}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
