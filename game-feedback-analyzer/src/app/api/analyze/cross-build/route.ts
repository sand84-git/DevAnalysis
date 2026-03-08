import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { compareBuildResults } from '@/lib/analysis/cross-build';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const existing = await prisma.crossBuildAnalysis.findUnique({
    where: { projectId },
  });

  if (!existing) {
    return NextResponse.json({ resultJson: null });
  }

  return NextResponse.json(existing);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId } = body as { projectId: string };

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const builds = await prisma.build.findMany({
    where: { projectId },
    include: { analysis: true },
    orderBy: { order: 'asc' },
  });

  const analyzedBuilds = builds.filter((b) => b.analysis?.qualitativeJson);

  if (analyzedBuilds.length < 2) {
    return NextResponse.json(
      { error: 'At least 2 analyzed builds required for comparison' },
      { status: 400 }
    );
  }

  const buildData = analyzedBuilds.map((b) => ({
    buildId: b.id,
    buildName: b.name,
    date: b.date.toISOString(),
    testType: b.testType ?? undefined,
    changes: b.changes ?? undefined,
    notes: b.notes ?? undefined,
    qualitativeJson: b.analysis!.qualitativeJson!,
    quantitativeJson: b.analysis!.quantitativeJson ?? undefined,
  }));

  const result = await compareBuildResults({
    builds: buildData,
    projectId,
  });

  // Save cross-build analysis
  await prisma.crossBuildAnalysis.upsert({
    where: { projectId },
    update: {
      resultJson: JSON.stringify(result),
    },
    create: {
      projectId,
      resultJson: JSON.stringify(result),
    },
  });

  return NextResponse.json(result);
}
