import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseXlsx } from '@/lib/parsers/xlsx-parser';
import { parsePdf } from '@/lib/parsers/pdf-parser';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const buildId = formData.get('buildId') as string | null;

  if (!file || !buildId) {
    return NextResponse.json({ error: 'file and buildId required' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileType = file.name.split('.').pop()?.toLowerCase() ?? '';

  let parsedColumns = null;
  let rowCount = null;
  let parseResult = null;

  if (fileType === 'xlsx' || fileType === 'xls') {
    const sheets = await parseXlsx(buffer);
    parseResult = sheets;
    parsedColumns = JSON.stringify(sheets[0]?.columns ?? []);
    rowCount = sheets[0]?.rowCount ?? 0;
  } else if (fileType === 'pdf') {
    const pdf = await parsePdf(buffer);
    parseResult = pdf;
    rowCount = pdf.sections.length;
  } else if (fileType === 'csv') {
    return NextResponse.json({ error: 'CSV support coming soon' }, { status: 400 });
  } else {
    return NextResponse.json({ error: `Unsupported file type: ${fileType}` }, { status: 400 });
  }

  const feedbackFile = await prisma.feedbackFile.create({
    data: {
      buildId,
      filename: file.name,
      fileType,
      fileSize: buffer.length,
      rawData: buffer,
      parsedColumns,
      rowCount,
    },
  });

  return NextResponse.json({
    file: feedbackFile,
    parseResult,
  }, { status: 201 });
}
