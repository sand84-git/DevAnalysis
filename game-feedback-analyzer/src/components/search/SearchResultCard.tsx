import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Sentiment } from '@/types';

const sentimentConfig: Record<
  Sentiment,
  { label: string; className: string }
> = {
  positive: { label: '긍정', className: 'bg-success/10 text-success' },
  enthusiastic: { label: '열광', className: 'bg-accent3/10 text-accent3' },
  constructive_negative: {
    label: '건설적 부정',
    className: 'bg-accent2/10 text-accent2',
  },
  frustrated: { label: '불만', className: 'bg-danger/10 text-danger' },
  neutral: { label: '중립', className: 'bg-text-lt/10 text-text-lt' },
  mixed: { label: '혼합', className: 'bg-accent4/10 text-accent4' },
};

interface SearchResultCardProps {
  text: string;
  buildName: string;
  sentiment: Sentiment;
  categories: string[];
  language?: string;
  className?: string;
}

export function SearchResultCard({
  text,
  buildName,
  sentiment,
  categories,
  language,
  className,
}: SearchResultCardProps) {
  const sentimentCfg = sentimentConfig[sentiment];

  return (
    <div
      className={cn(
        'rounded-[10px] border border-border bg-card p-4 space-y-3',
        className
      )}
    >
      <p className="text-sm leading-relaxed text-text-mid">{text}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn('text-xs', sentimentCfg.className)}>
          {sentimentCfg.label}
        </Badge>
        <span className="text-xs text-text-lt">{buildName}</span>
        {language && (
          <span className="text-xs text-text-lt">&middot; {language}</span>
        )}
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-md bg-bg px-2 py-0.5 text-xs text-text-lt"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
