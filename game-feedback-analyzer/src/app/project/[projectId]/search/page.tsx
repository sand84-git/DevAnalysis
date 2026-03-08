'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import type { Sentiment } from '@/types';

interface SearchResult {
  id: string;
  text: string;
  buildName: string;
  sentiment: Sentiment;
  categories: string[];
  language?: string;
}

export default function SearchPage() {
  const params = useParams<{ projectId: string }>();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    build?: string;
    category?: string;
    sentiment?: string;
    language?: string;
  }>({});

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const searchParams = new URLSearchParams({ q: query });
        if (selectedFilters.build)
          searchParams.set('build', selectedFilters.build);
        if (selectedFilters.category)
          searchParams.set('category', selectedFilters.category);
        if (selectedFilters.sentiment)
          searchParams.set('sentiment', selectedFilters.sentiment);
        if (selectedFilters.language)
          searchParams.set('language', selectedFilters.language);

        const res = await fetch(
          `/api/projects/${params.projectId}/search?${searchParams}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
        }
      } catch {
        // API not yet implemented
      } finally {
        setLoading(false);
      }
    },
    [params.projectId, selectedFilters]
  );

  const handleFilterChange = (
    key: 'build' | 'category' | 'sentiment' | 'language',
    value: string | undefined
  ) => {
    setSelectedFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="px-8 py-8">
      <h2 className="mb-6 text-xl font-bold">피드백 검색</h2>

      <div className="mb-6 max-w-xl">
        <SearchBar onSearch={handleSearch} />
      </div>

      <SearchFilters
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        className="mb-6"
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-text-lt">
          검색 중...
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result) => (
            <SearchResultCard
              key={result.id}
              text={result.text}
              buildName={result.buildName}
              sentiment={result.sentiment}
              categories={result.categories}
              language={result.language}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-text-lt">
          검색어를 입력하여 피드백을 찾아보세요.
        </div>
      )}
    </div>
  );
}
