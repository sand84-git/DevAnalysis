'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { ColumnMapper } from '@/components/upload/ColumnMapper';
import { ParsePreview } from '@/components/upload/ParsePreview';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { Badge } from '@/components/ui/badge';
import type { DetectedColumn, ColumnType } from '@/types';

interface BuildDetail {
  id: string;
  name: string;
  version?: string;
  date: string;
  testType?: string;
  notes?: string;
  feedbackCount: number;
  analysisStatus: string;
}

interface ParseResult {
  rowCount: number;
  languageDistribution: Record<string, number>;
  columns: DetectedColumn[];
}

const tabs = [
  { id: 'upload', label: '데이터 업로드' },
  { id: 'responses', label: '응답 목록' },
];

export default function BuildDetailPage() {
  const params = useParams<{ projectId: string; buildId: string }>();
  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [detectedColumns, setDetectedColumns] = useState<DetectedColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/builds/${params.buildId}`)
      .then((res) => res.json())
      .then((data) => setBuild(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.projectId, params.buildId]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('buildId', params.buildId);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          const pr = data.parseResult;
          setParseResult(pr);
          setDetectedColumns(pr?.columns ?? []);
        }
      } catch {
        // Upload not yet implemented
      }
    },
    [params.projectId, params.buildId]
  );

  const handleColumnTypeChange = (name: string, newType: ColumnType) => {
    setDetectedColumns((prev) =>
      prev.map((col) =>
        col.name === name ? { ...col, type: newType } : col
      )
    );
  };

  if (loading) {
    return (
      <div className="px-8 py-8 text-sm text-text-lt">불러오는 중...</div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{build?.name ?? '빌드'}</h2>
          {build?.version && (
            <Badge variant="outline" className="text-xs">
              v{build.version}
            </Badge>
          )}
        </div>
        {build?.date && (
          <p className="mt-1 text-sm text-text-lt">{build.date}</p>
        )}
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'upload' && (
        <div className="max-w-2xl space-y-6">
          <FileDropzone onFileSelect={handleFileSelect} />

          {parseResult && (
            <>
              <ParsePreview
                rowCount={parseResult.rowCount}
                languageDistribution={parseResult.languageDistribution}
                columns={detectedColumns.map((c) => c.name)}
              />
              <ColumnMapper
                columns={detectedColumns}
                onTypeChange={handleColumnTypeChange}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="py-12 text-center text-sm text-text-lt">
          아직 업로드된 응답이 없습니다.
        </div>
      )}
    </div>
  );
}
