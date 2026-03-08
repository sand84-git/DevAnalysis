import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runQualitativeAnalysis } from '@/lib/analysis/qualitative';
import type { AnalysisLevel } from '@/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { buildId, level } = body as { buildId: string; level: AnalysisLevel };

  if (!buildId || !level) {
    return NextResponse.json({ error: 'buildId and level required' }, { status: 400 });
  }

  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: {
      project: { include: { categories: true } },
      responses: true,
    },
  });

  if (!build) {
    return NextResponse.json({ error: 'Build not found' }, { status: 404 });
  }

  if (build.responses.length === 0) {
    return NextResponse.json({ error: 'No feedback responses to analyze' }, { status: 400 });
  }

  const responses = build.responses.map((r) => ({
    id: r.id,
    text: r.text,
  }));

  const categories = build.project.categories.map((c) => c.name);

  const result = await runQualitativeAnalysis({
    responses,
    categories,
    directionDoc: build.project.directionDoc || undefined,
    analysisLevel: level,
    buildId,
  });

  // Save analysis to DB
  await prisma.buildAnalysis.upsert({
    where: { buildId },
    update: {
      analysisLevel: level,
      qualitativeJson: JSON.stringify(result),
      analyzedAt: new Date(),
    },
    create: {
      buildId,
      analysisLevel: level,
      qualitativeJson: JSON.stringify(result),
    },
  });

  // Update classified responses
  for (const classified of result.classification.classifiedResponses) {
    await prisma.feedbackResponse.update({
      where: { id: classified.id },
      data: {
        categories: JSON.stringify(classified.categories),
        sentiment: classified.sentiment,
        confidence: classified.confidence,
        summary: classified.summary,
      },
    });
  }

  return NextResponse.json(result);
}
