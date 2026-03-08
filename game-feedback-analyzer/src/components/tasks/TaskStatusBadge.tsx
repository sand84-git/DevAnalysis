import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types';

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  open: { label: '열림', className: 'bg-danger/10 text-danger' },
  improving: { label: '개선 중', className: 'bg-warn/10 text-warn' },
  resolved: { label: '해결됨', className: 'bg-success/10 text-success' },
  hold: { label: '보류', className: 'bg-text-lt/10 text-text-lt' },
  worsened: { label: '악화', className: 'bg-accent1/10 text-accent1' },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge className={cn('text-xs', config.className, className)}>
      {config.label}
    </Badge>
  );
}
