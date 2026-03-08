'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { ColumnMapper } from '@/components/upload/ColumnMapper';
import { ParsePreview } from '@/components/upload/ParsePreview';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { Badge } from '@/components/ui/badge';
import type { DetectedColumn, ColumnType } from '@/types';

interface SavedResponse {
  id: string;
  text: string;
  sentiment: string | null;
  categories: string | null;
  confidence: number | null;
  respondentId: string | null;
}

interface BuildData {
  id: string;
  name: string;
  version?: string;
  date: string;
  responses: SavedResponse[];
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
  const [build, setBuild] = useState<BuildData | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [detectedColumns, setDetectedColumns] = useState<DetectedColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const fetchBuild = useCallback(async () => {
    try {
      const res = await fetch(`/api/builds/${params.buildId}`);
      if (res.ok) {
        const data = await res.json();
        setBuild(data);
      }
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [params.buildId]);

  useEffect(() => {
    fetchBuild();
  }, [fetchBuild]);

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
            setUploadMessage(null);
          }
        }
      } catch {
        // Upload failed
      }
    },
    [params.buildId]
  );

  const handleColumnTypeChange = (name: string, newType: ColumnType) => {
    setDetectedColumns((prev) =>
      prev.map((col) =>
        col.name === name ? { ...col, type: newType } : col
      )
    );
    setConfirmError(null);
  };

  const handleConfirm = useCallback(async () => {
    if (!parseResult) return;
    setIsConfirming(true);
    setConfirmError(null);
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
        const skipped = data.skippedCount ?? 0;
        setUploadMessage(
          `${data.totalRows ?? data.count}개 행 중 ${data.count}건 저장${skipped > 0 ? ` (${skipped}개 빈 텍스트 제외)` : ''}`
        );
        setConfirmError(null);
        setParseResult(null);
        setActiveTab('responses');
        // DB에서 최신 응답 목록 리페치
        await fetchBuild();
      } else {
        const data = await res.json().catch(() => null);
        setConfirmError(data?.error ?? '저장에 실패했습니다.');
      }
    } catch {
      setConfirmError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsConfirming(false);
    }
  }, [params.buildId, parseResult, detectedColumns, fetchBuild]);

  if (loading) {
    return (
      <div className="px-8 py-8 text-sm text-text-lt">불러오는 중...</div>
    );
  }

  const responses = build?.responses ?? [];

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
                error={confirmError}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="space-y-4">
          {uploadMessage && (
            <p className="text-sm text-text-mid">{uploadMessage}</p>
          )}

          {responses.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg/50">
                    <th className="px-4 py-2.5 text-left font-medium text-text-lt">#</th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-lt">응답 텍스트</th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-lt">감정</th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-lt">신뢰도</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, i) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="px-4 py-2 text-text-lt">{i + 1}</td>
                      <td className="max-w-md truncate px-4 py-2 text-text">{r.text}</td>
                      <td className="px-4 py-2">
                        {r.sentiment ? (
                          <Badge variant="outline" className="text-xs">
                            {r.sentiment}
                          </Badge>
                        ) : (
                          <span className="text-text-lt">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-text-mid">
                        {r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-text-lt">
              아직 업로드된 응답이 없습니다.
            </div>
          )}

          <p className="text-xs text-text-lt">총 {responses.length}건</p>
        </div>
      )}
    </div>
  );
}
