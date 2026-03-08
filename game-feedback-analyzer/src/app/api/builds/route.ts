import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const builds = await prisma.build.findMany({
    where: { projectId },
    include: {
      _count: { select: { responses: true, feedbackFiles: true } },
      analysis: { select: { id: true, analysisLevel: true, analyzedAt: true } },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(builds);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, name, version, date, notes, changes, testType, testTarget, testCount, playTime, caution, biasProfile } = body;

  if (!projectId || !name || !date) {
    return NextResponse.json({ error: 'projectId, name, date required' }, { status: 400 });
  }

  const maxOrder = await prisma.build.findFirst({
    where: { projectId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const build = await prisma.build.create({
    data: {
      projectId,
      name,
      version,
      date: new Date(date),
      notes,
      changes: changes || null,
      testType,
      testTarget,
      testCount: testCount ? parseInt(testCount, 10) : null,
      playTime,
      caution,
      biasProfile: biasProfile ? JSON.stringify(biasProfile) : null,
      order: (maxOrder?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(build, { status: 201 });
}
