import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface ColumnMapping {
  name: string;
  type: 'score' | 'choice' | 'open_text' | 'meta';
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { buildId, fileId, columnMapping, rows, headers } = body as {
    buildId: string;
    fileId: string;
    columnMapping: ColumnMapping[];
    rows: (string | number | null)[][];
    headers: string[];
  };

  if (!buildId || !fileId || !columnMapping || !rows || !headers) {
    return NextResponse.json(
      { error: 'buildId, fileId, columnMapping, rows, headers required' },
      { status: 400 }
    );
  }

  // open_text 컬럼 인덱스 찾기
  const openTextIndices = columnMapping
    .filter((c) => c.type === 'open_text')
    .map((c) => headers.indexOf(c.name))
    .filter((i) => i !== -1);

  // meta 컬럼 중 첫 번째를 respondentId로 사용
  const metaIndex = columnMapping
    .filter((c) => c.type === 'meta')
    .map((c) => headers.indexOf(c.name))
    .find((i) => i !== -1);

  // open_text 컬럼이 없으면 모든 비-score/choice/meta 텍스트를 합쳐서 저장
  // open_text 컬럼이 있으면 해당 컬럼만 사용
  const textIndices = openTextIndices.length > 0
    ? openTextIndices
    : columnMapping
        .filter((c) => c.type !== 'score')
        .map((c) => headers.indexOf(c.name))
        .filter((i) => i !== -1);

  // 각 row를 FeedbackResponse로 변환
  const responsesData = rows
    .map((row) => {
      const textParts = textIndices
        .map((i) => row[i])
        .filter((v) => v != null && String(v).trim() !== '');
      const text = textParts.map(String).join('\n\n');

      if (!text) return null;

      return {
        buildId,
        fileId,
        text,
        respondentId: metaIndex != null ? String(row[metaIndex] ?? '') || null : null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (responsesData.length === 0) {
    return NextResponse.json(
      { error: '저장할 텍스트 데이터가 없습니다.' },
      { status: 400 }
    );
  }

  // 기존 응답 삭제 후 일괄 생성 (중복 방지)
  await prisma.feedbackResponse.deleteMany({
    where: { buildId },
  });

  // 기존 분석 결과도 초기화
  await prisma.buildAnalysis.deleteMany({
    where: { buildId },
  });

  const result = await prisma.feedbackResponse.createMany({
    data: responsesData,
  });

  const skippedCount = rows.length - responsesData.length;

  return NextResponse.json({
    success: true,
    count: result.count,
    totalRows: rows.length,
    skippedCount,
  }, { status: 201 });
}
