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
  rows: (string | number | null)[][];
  headers: string[];
  fileId: string;
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

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
          const sheets = data.parseResult;
          const firstSheet = Array.isArray(sheets) ? sheets[0] : sheets;
          if (firstSheet) {
            setParseResult({
              rowCount: firstSheet.rowCount,
              languageDistribution: {},
              columns: firstSheet.columns,
              rows: firstSheet.rows,
              headers: firstSheet.headers,
              fileId: data.file.id,
            });
            setDetectedColumns(firstSheet.columns ?? []);
            setSavedCount(null);
          }
        }
      } catch {
        // Upload failed
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

  const handleConfirm = useCallback(async () => {
    if (!parseResult) return;
    setIsConfirming(true);
    try {
      const res = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildId: params.buildId,
          fileId: parseResult.fileId,
          columnMapping: detectedColumns.map((c) => ({
            name: c.name,
            type: c.type,
          })),
          rows: parseResult.rows,
          headers: parseResult.headers,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedCount(data.count);
        setActiveTab('responses');
      }
    } catch {
      // Confirm failed
    } finally {
      setIsConfirming(false);
    }
  }, [params.buildId, parseResult, detectedColumns]);

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
                onConfirm={handleConfirm}
                isConfirming={isConfirming}
                rowCount={parseResult.rowCount}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="py-12 text-center text-sm text-text-lt">
          {savedCount != null
            ? `${savedCount}건의 응답이 저장되었습니다.`
            : '아직 업로드된 응답이 없습니다.'}
        </div>
      )}
    </div>
  );
}
