import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAnalysisHTML } from '@/lib/export/html-generator';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { buildId } = body as { buildId: string };

  if (!buildId) {
    return NextResponse.json({ error: 'buildId required' }, { status: 400 });
  }

  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: {
      analysis: true,
      responses: true,
    },
  });

  if (!build) {
    return NextResponse.json({ error: 'Build not found' }, { status: 404 });
  }

  if (!build.analysis?.qualitativeJson) {
    return NextResponse.json(
      { error: 'No analysis data available. Run analysis first.' },
      { status: 400 }
    );
  }

  const qualitativeData = JSON.parse(build.analysis.qualitativeJson);

  const html = generateAnalysisHTML({
    buildName: build.name,
    buildDate: build.date.toISOString().slice(0, 10),
    analysisLevel: build.analysis.analysisLevel,
    totalResponses: build.responses.length,
    classification: qualitativeData.classification,
    userAdvocate: qualitativeData.userAdvocate,
    designAdvocate: qualitativeData.designAdvocate,
    synthesis: qualitativeData.synthesis,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${build.name}-analysis-report.html"`,
    },
  });
}
