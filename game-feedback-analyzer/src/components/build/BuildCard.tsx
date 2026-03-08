import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, MessageSquare } from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '대기', className: 'bg-text-lt/10 text-text-lt' },
  analyzing: { label: '분석 중', className: 'bg-accent2/10 text-accent2' },
  done: { label: '완료', className: 'bg-success/10 text-success' },
  error: { label: '오류', className: 'bg-danger/10 text-danger' },
};

const testTypeLabels: Record<string, string> = {
  field_test: '필드 테스트',
  internal: '내부 테스트',
  fgt: 'FGT',
  cbt: 'CBT',
  soft_launch: '소프트 런치',
  other: '기타',
};

interface BuildCardProps {
  id: string;
  projectId: string;
  name: string;
  date: string;
  testType?: string | null;
  feedbackCount: number;
  analysisStatus: string;
  className?: string;
}

export function BuildCard({
  id,
  projectId,
  name,
  date,
  testType,
  feedbackCount,
  analysisStatus,
  className,
}: BuildCardProps) {
  const status = statusConfig[analysisStatus] ?? statusConfig.pending;

  return (
    <Link
      href={`/project/${projectId}/builds/${id}`}
      className={cn(
        'block rounded-[10px] border border-border bg-card p-5 transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold text-text">
            {name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-lt">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(date).toLocaleDateString('ko-KR')}
            </span>
            {testType && (
              <span>{testTypeLabels[testType] ?? testType}</span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              응답 {feedbackCount}건
            </span>
          </div>
        </div>
        <Badge className={cn('text-xs shrink-0', status.className)}>
          {status.label}
        </Badge>
      </div>
    </Link>
  );
}
