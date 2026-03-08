'use client';

interface SegmentRow {
  segment: string;
  responseCount: number;
  topCategories: string[];
  dominantSentiment: string;
  keyInsight: string;
}

interface SegmentTableProps {
  data: SegmentRow[];
}

const SENTIMENT_BADGE: Record<string, string> = {
  positive: 'bg-d-green/20 text-d-green',
  enthusiastic: 'bg-d-yellow/20 text-d-yellow',
  constructive_negative: 'bg-d-blue/20 text-d-blue',
  frustrated: 'bg-d-red/20 text-d-red',
  neutral: 'bg-dark-sub/20 text-dark-sub',
  mixed: 'bg-d-purple/20 text-d-purple',
};

export default function SegmentTable({ data }: SegmentTableProps) {
  return (
    <div className="rounded-[10px] border border-border bg-dark-bg p-6">
      <h3 className="mb-4 font-display text-lg text-dark-text">
        응답자 세그먼트 분석
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-grid">
              <th className="py-2 text-left font-medium text-dark-sub">세그먼트</th>
              <th className="py-2 text-left font-medium text-dark-sub">응답 수</th>
              <th className="py-2 text-left font-medium text-dark-sub">주요 카테고리</th>
              <th className="py-2 text-left font-medium text-dark-sub">주요 감정</th>
              <th className="py-2 text-left font-medium text-dark-sub">핵심 인사이트</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.segment} className="border-b border-dark-grid/50">
                <td className="py-3 font-medium text-dark-text">{row.segment}</td>
                <td className="py-3 text-dark-sub">{row.responseCount}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.topCategories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded bg-dark-grid px-2 py-0.5 text-xs text-dark-sub"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SENTIMENT_BADGE[row.dominantSentiment] ?? 'bg-dark-grid text-dark-sub'}`}
                  >
                    {row.dominantSentiment}
                  </span>
                </td>
                <td className="py-3 text-dark-sub">{row.keyInsight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { SegmentRow };
