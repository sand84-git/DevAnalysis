'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({
  value: controlledValue,
  onSearch,
  placeholder = '피드백을 검색하세요...',
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState(controlledValue ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setQuery(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [query, debounceMs, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-lt" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setQuery('')}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
