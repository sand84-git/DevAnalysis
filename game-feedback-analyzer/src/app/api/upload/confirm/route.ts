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

  if (openTextIndices.length === 0) {
    return NextResponse.json(
      { error: '주관식(open_text) 컬럼을 최소 1개 지정해주세요.' },
      { status: 400 }
    );
  }

  // meta 컬럼 중 첫 번째를 respondentId로 사용
  const metaIndex = columnMapping
    .filter((c) => c.type === 'meta')
    .map((c) => headers.indexOf(c.name))
    .find((i) => i !== -1);

  // 각 row를 FeedbackResponse로 변환
  const responsesData = rows
    .map((row) => {
      const textParts = openTextIndices
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
      { error: '저장할 응답이 없습니다. 주관식 컬럼에 내용이 있는지 확인해주세요.' },
      { status: 400 }
    );
  }

  // 일괄 생성
  const result = await prisma.feedbackResponse.createMany({
    data: responsesData,
  });

  return NextResponse.json({
    success: true,
    count: result.count,
  }, { status: 201 });
}
