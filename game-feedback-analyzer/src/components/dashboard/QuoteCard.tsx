'use client';

import type { Sentiment } from '@/types';

interface QuoteCardProps {
  quote: string;
  sentiment: Sentiment;
  categories: string[];
  respondentId?: string;
}

const SENTIMENT_BADGE: Record<Sentiment, { label: string; className: string }> = {
  positive: { label: '긍정', className: 'bg-d-green/20 text-d-green' },
  enthusiastic: { label: '열광', className: 'bg-d-yellow/20 text-d-yellow' },
  constructive_negative: { label: '건설적 부정', className: 'bg-d-blue/20 text-d-blue' },
  frustrated: { label: '불만', className: 'bg-d-red/20 text-d-red' },
  neutral: { label: '중립', className: 'bg-dark-sub/20 text-dark-sub' },
  mixed: { label: '혼합', className: 'bg-d-purple/20 text-d-purple' },
};

export default function QuoteCard({
  quote,
  sentiment,
  categories,
  respondentId,
}: QuoteCardProps) {
  const badge = SENTIMENT_BADGE[sentiment];

  return (
    <div className="rounded-[10px] border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
        {categories.map((cat) => (
          <span
            key={cat}
            className="inline-block rounded bg-bg px-2 py-0.5 text-xs text-text-mid"
          >
            {cat}
          </span>
        ))}
      </div>
      <blockquote className="border-l-3 border-accent1 pl-4 text-sm leading-relaxed text-text italic">
        &ldquo;{quote}&rdquo;
      </blockquote>
      {respondentId && (
        <p className="mt-2 text-right text-xs text-text-lt">— {respondentId}</p>
      )}
    </div>
  );
}
