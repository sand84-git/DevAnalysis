'use client';

import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
}

interface SearchFiltersProps {
  builds?: FilterOption[];
  categories?: FilterOption[];
  sentiments?: FilterOption[];
  languages?: FilterOption[];
  selectedFilters: {
    build?: string;
    category?: string;
    sentiment?: string;
    language?: string;
  };
  onFilterChange: (
    key: 'build' | 'category' | 'sentiment' | 'language',
    value: string | undefined
  ) => void;
  className?: string;
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-accent1 text-white'
          : 'bg-bg text-text-mid hover:bg-accent1/10 hover:text-accent1'
      )}
    >
      {label}
    </button>
  );
}

export function SearchFilters({
  builds = [],
  categories = [],
  sentiments = [],
  languages = [],
  selectedFilters,
  onFilterChange,
  className,
}: SearchFiltersProps) {
  const renderGroup = (
    label: string,
    key: 'build' | 'category' | 'sentiment' | 'language',
    options: FilterOption[]
  ) => {
    if (options.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-text-lt">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => (
            <FilterPill
              key={opt.id}
              label={opt.label}
              active={selectedFilters[key] === opt.id}
              onClick={() =>
                onFilterChange(
                  key,
                  selectedFilters[key] === opt.id ? undefined : opt.id
                )
              }
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {renderGroup('빌드', 'build', builds)}
      {renderGroup('카테고리', 'category', categories)}
      {renderGroup('감정', 'sentiment', sentiments)}
      {renderGroup('언어', 'language', languages)}
    </div>
  );
}
