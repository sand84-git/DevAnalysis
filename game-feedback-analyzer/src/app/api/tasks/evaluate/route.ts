import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { evaluateTask } from '@/lib/analysis/task-evaluator';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { taskId, buildId } = body as { taskId: string; buildId: string };

  if (!taskId || !buildId) {
    return NextResponse.json({ error: 'taskId and buildId required' }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      histories: {
        include: { build: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const analysis = await prisma.buildAnalysis.findUnique({
    where: { buildId },
  });

  if (!analysis || !analysis.qualitativeJson) {
    return NextResponse.json({ error: 'Build analysis not found' }, { status: 400 });
  }

  const evaluation = await evaluateTask({
    task: {
      title: task.title,
      description: task.description ?? undefined,
      section: task.section ?? undefined,
      currentStatus: task.currentStatus,
      priority: task.priority,
    },
    analysisResult: {
      qualitative: analysis.qualitativeJson,
      quantitative: analysis.quantitativeJson ?? undefined,
    },
    taskHistory: task.histories.map((h) => ({
      buildId: h.buildId,
      buildName: h.build.name,
      status: h.status,
      note: h.note ?? undefined,
    })),
    buildId,
  });

  // Update task history with evaluation result
  const statusFromScore = evaluation.feedbackScore >= 7 ? 'resolved' :
    evaluation.feedbackScore >= 4 ? 'improving' : 'open';

  await prisma.taskHistory.upsert({
    where: { taskId_buildId: { taskId, buildId } },
    update: {
      status: statusFromScore,
      note: evaluation.reasoning,
      evidence: JSON.stringify(evaluation.relatedQuotes),
    },
    create: {
      taskId,
      buildId,
      status: statusFromScore,
      note: evaluation.reasoning,
      evidence: JSON.stringify(evaluation.relatedQuotes),
    },
  });

  return NextResponse.json(evaluation);
}
