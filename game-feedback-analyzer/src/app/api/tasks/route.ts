import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { histories: { include: { build: true }, orderBy: { createdAt: 'asc' } } },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, section, title, description, priority, discoveredBuildId, targetBuildId } = body;

  if (!projectId || !section || !title || !priority) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      projectId, section, title, description, priority,
      discoveredBuildId, targetBuildId,
    },
  });

  // 발견 빌드가 있으면 이력 자동 생성
  if (discoveredBuildId) {
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        buildId: discoveredBuildId,
        status: 'open',
        note: '최초 발견',
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}
