import { prisma } from '@/lib/db';

export async function carryOverTasks(projectId: string, newBuildId: string) {
  // 이전 빌드의 미해결/개선중 태스크를 새 빌드로 이월
  const openTasks = await prisma.task.findMany({
    where: {
      projectId,
      currentStatus: { in: ['open', 'improving'] },
    },
  });

  const histories = openTasks.map((task) => ({
    taskId: task.id,
    buildId: newBuildId,
    status: task.currentStatus,
    note: '이전 빌드에서 자동 이월',
  }));

  if (histories.length > 0) {
    await prisma.taskHistory.createMany({ data: histories });
  }

  return { carriedOver: histories.length, tasks: openTasks };
}
