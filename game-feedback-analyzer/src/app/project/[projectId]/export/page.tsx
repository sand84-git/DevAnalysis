'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Build {
  id: string;
  name: string;
  version: string | null;
  analysis: { id: string; analysisLevel: string; analyzedAt: string } | null;
}

export default function ExportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [slackPreview, setSlackPreview] = useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuilds() {
      try {
        const res = await fetch(`/api/builds?projectId=${projectId}`);
        if (res.ok) {
          const data: Build[] = await res.json();
          setBuilds(data);
          // Default to the latest build with analysis
          const analyzed = data.filter((b) => b.analysis);
          if (analyzed.length > 0) {
            setSelectedBuildId(analyzed[analyzed.length - 1].id);
          } else if (data.length > 0) {
            setSelectedBuildId(data[data.length - 1].id);
          }
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchBuilds();
  }, [projectId]);

  const selectedBuild = builds.find((b) => b.id === selectedBuildId);
  const hasAnalysis = !!selectedBuild?.analysis;

  const handleExportHTML = async () => {
    if (!selectedBuildId) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId: selectedBuildId }),
      });

      if (res.ok) {
        const html = await res.text();
        // Download the file
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedBuild?.name ?? 'analysis'}-report.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setHtmlPreview(html);
      }
    } catch {
      // Handle error
    } finally {
      setExporting(false);
    }
  };

  const handleExportSlack = async () => {
    if (!selectedBuildId) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId: selectedBuildId }),
      });

      if (res.ok) {
        const data = await res.json();
        setSlackPreview(JSON.stringify(data, null, 2));
      }
    } catch {
      // Handle error
    } finally {
      setExporting(false);
    }
  };

  const handleCopySlack = () => {
    if (slackPreview) {
      navigator.clipboard.writeText(slackPreview);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-text-lt">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-text">내보내기</h1>

      {/* Build selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-text-mid">빌드 선택</label>
        <Select value={selectedBuildId} onValueChange={(v) => { if (v) setSelectedBuildId(v); }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="빌드를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {builds.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
                {b.analysis ? ' (분석 완료)' : ' (미분석)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBuild && (
          <Badge variant={hasAnalysis ? 'default' : 'outline'}>
            {hasAnalysis
              ? `${selectedBuild.analysis?.analysisLevel} 분석 완료`
              : '미분석'}
          </Badge>
        )}
      </div>

      {!hasAnalysis && (
        <Card>
          <CardContent className="py-6">
            <p className="text-text-lt">
              선택한 빌드에 분석 데이터가 없습니다. 분석을 먼저 실행해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Export options */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* HTML Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              HTML 리포트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-lt">
              대시보드 스타일의 자체 포함 HTML 리포트를 다운로드합니다.
              오프라인에서 열거나 팀에 공유할 수 있습니다.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-text-mid">
              <li>카테고리별 감정 분석</li>
              <li>핵심 불만 사항 및 매력 요소</li>
              <li>방향성 갭 분석</li>
              <li>우선순위 랭킹</li>
            </ul>
            <Button
              onClick={handleExportHTML}
              disabled={!hasAnalysis || exporting}
              className="w-full"
            >
              {exporting ? '생성 중...' : 'HTML 다운로드'}
            </Button>
          </CardContent>
        </Card>

        {/* Slack Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Slack 메시지
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-lt">
              Slack Block Kit 형식의 메시지를 생성합니다.
              Slack Webhook이나 API를 통해 채널에 게시할 수 있습니다.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-text-mid">
              <li>주요 카테고리 요약</li>
              <li>핵심 발견 사항</li>
              <li>우선순위 액션 아이템</li>
              <li>이모지 인디케이터</li>
            </ul>
            <Button
              onClick={handleExportSlack}
              disabled={!hasAnalysis || exporting}
              className="w-full"
            >
              {exporting ? '생성 중...' : 'Slack 메시지 생성'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview area */}
      {slackPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Slack 메시지 미리보기</CardTitle>
              <Button variant="outline" onClick={handleCopySlack}>
                클립보드에 복사
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-lg bg-bg p-4 text-xs text-text-mid">
              {slackPreview}
            </pre>
          </CardContent>
        </Card>
      )}

      {htmlPreview && (
        <Card>
          <CardHeader>
            <CardTitle>HTML 리포트 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                srcDoc={htmlPreview}
                className="h-96 w-full bg-white"
                title="HTML 리포트 미리보기"
                sandbox="allow-same-origin"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
