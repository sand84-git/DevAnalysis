'use client';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DetectedColumn, ColumnType } from '@/types';

const columnTypeConfig: Record<ColumnType, { label: string; className: string }> = {
  score: { label: '점수', className: 'bg-accent2/10 text-accent2' },
  choice: { label: '선택형', className: 'bg-accent4/10 text-accent4' },
  open_text: { label: '주관식', className: 'bg-accent1/10 text-accent1' },
  meta: { label: '메타', className: 'bg-text-lt/10 text-text-lt' },
};

const columnTypeOptions: { value: ColumnType; label: string }[] = [
  { value: 'score', label: '점수' },
  { value: 'choice', label: '선택형' },
  { value: 'open_text', label: '주관식' },
  { value: 'meta', label: '메타' },
];

interface ColumnMapperProps {
  columns: DetectedColumn[];
  onTypeChange: (columnName: string, newType: ColumnType) => void;
  className?: string;
}

export function ColumnMapper({
  columns,
  onTypeChange,
  className,
}: ColumnMapperProps) {
  if (columns.length === 0) return null;

  return (
    <div className={cn('rounded-[10px] border border-border bg-card p-6', className)}>
      <h4 className="mb-4 font-display text-sm font-bold text-text">
        컬럼 유형 설정
      </h4>
      <div className="space-y-3">
        {columns.map((col) => {
          const typeConfig = columnTypeConfig[col.type];
          return (
            <div
              key={col.name}
              className="flex items-center gap-3 rounded-lg border border-border bg-bg/50 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-text">
                    {col.name}
                  </span>
                  <Badge className={cn('text-[10px]', typeConfig.className)}>
                    {typeConfig.label}
                  </Badge>
                </div>
                {col.sampleValues.length > 0 && (
                  <p className="mt-1 truncate text-xs text-text-lt">
                    예시: {col.sampleValues.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
              <Select
                value={col.type}
                onValueChange={(val) =>
                  onTypeChange(col.name, val as ColumnType)
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columnTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
