import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runQuantitativeAnalysis } from '@/lib/analysis/quantitative';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { buildId, columnTypes } = body as {
    buildId: string;
    columnTypes: Record<string, 'score' | 'choice' | 'open_text' | 'meta'>;
  };

  if (!buildId || !columnTypes) {
    return NextResponse.json({ error: 'buildId and columnTypes required' }, { status: 400 });
  }

  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: { feedbackFiles: true },
  });

  if (!build) {
    return NextResponse.json({ error: 'Build not found' }, { status: 404 });
  }

  // Get parsed data from feedback files
  const file = build.feedbackFiles[0];
  if (!file || !file.parsedColumns) {
    return NextResponse.json({ error: 'No parsed feedback file found' }, { status: 400 });
  }

  // Get sentiment map from classified responses
  const responses = await prisma.feedbackResponse.findMany({
    where: { buildId },
    select: { respondentId: true, sentiment: true },
  });

  const sentimentMap: Record<string, string> = {};
  for (const r of responses) {
    if (r.respondentId && r.sentiment) {
      sentimentMap[r.respondentId] = r.sentiment;
    }
  }

  // Parse the file data - rows need to be reconstructed from stored data
  // For now, return the quantitative analysis with available data
  const result = runQuantitativeAnalysis({
    rows: [], // Will be populated from file parsing in integration
    columnTypes,
    sentimentMap: sentimentMap as Record<string, import('@/types').Sentiment>,
  });

  // Save to existing analysis
  await prisma.buildAnalysis.update({
    where: { buildId },
    data: {
      quantitativeJson: JSON.stringify(result),
    },
  });

  return NextResponse.json(result);
}
