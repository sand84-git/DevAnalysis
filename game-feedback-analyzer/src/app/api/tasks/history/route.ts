import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { taskId, buildId, status, note, evidence } = body;

  if (!taskId || !buildId || !status) {
    return NextResponse.json({ error: 'taskId, buildId, status required' }, { status: 400 });
  }

  const history = await prisma.taskHistory.upsert({
    where: { taskId_buildId: { taskId, buildId } },
    update: { status, note, evidence: evidence ? JSON.stringify(evidence) : null },
    create: {
      taskId, buildId, status, note,
      evidence: evidence ? JSON.stringify(evidence) : null,
    },
  });

  // 태스크의 현재 상태도 업데이트
  await prisma.task.update({
    where: { id: taskId },
    data: { currentStatus: status },
  });

  return NextResponse.json(history);
}
