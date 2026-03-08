import { cn } from '@/lib/utils';
import { FileSpreadsheet, Columns3, Globe } from 'lucide-react';

interface ParsePreviewProps {
  rowCount: number;
  columns: string[];
  languageDistribution?: Record<string, number>;
  sampleRows?: Record<string, string>[];
  className?: string;
}

export function ParsePreview({
  rowCount,
  columns,
  languageDistribution,
  sampleRows,
  className,
}: ParsePreviewProps) {
  return (
    <div className={cn('rounded-[10px] border border-border bg-card p-6 space-y-4', className)}>
      <h4 className="font-display text-sm font-bold text-text">
        파싱 결과 미리보기
      </h4>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-text-mid">
          <FileSpreadsheet className="size-4 text-text-lt" />
          <span>응답 {rowCount}건</span>
        </div>
        <div className="flex items-center gap-2 text-text-mid">
          <Columns3 className="size-4 text-text-lt" />
          <span>컬럼 {columns.length}개</span>
        </div>
        {languageDistribution && Object.keys(languageDistribution).length > 0 && (
          <div className="flex items-center gap-2 text-text-mid">
            <Globe className="size-4 text-text-lt" />
            <span>
              {Object.entries(languageDistribution)
                .map(([lang, count]) => `${lang}: ${count}건`)
                .join(', ')}
            </span>
          </div>
        )}
      </div>

      {columns.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-text-lt">컬럼 목록</p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((col, colIdx) => (
              <span
                key={colIdx}
                className="rounded-md bg-bg px-2 py-0.5 text-xs text-text-mid"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {sampleRows && sampleRows.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-text-lt">
            샘플 데이터 (최대 5행)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {columns.map((col, colIdx) => (
                    <th
                      key={colIdx}
                      className="px-2 py-1.5 text-left font-medium text-text-mid"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className="max-w-48 truncate px-2 py-1.5 text-text-lt"
                      >
                        {row[col] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
