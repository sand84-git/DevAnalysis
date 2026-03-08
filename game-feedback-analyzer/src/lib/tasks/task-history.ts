import { prisma } from '@/lib/db';

export async function getTaskAlerts(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      histories: { orderBy: { createdAt: 'asc' }, include: { build: true } },
    },
  });

  const alerts: Array<{ taskId: string; title: string; type: string; message: string }> = [];

  for (const task of tasks) {
    // 3빌드 연속 미해결 경고
    const consecutiveOpen = task.histories.filter((h) => h.status === 'open').length;
    if (consecutiveOpen >= 3) {
      alerts.push({
        taskId: task.id,
        title: task.title,
        type: 'long_unresolved',
        message: `${consecutiveOpen}빌드 연속 미해결`,
      });
    }

    // 해결→미해결 역행 경고
    for (let i = 1; i < task.histories.length; i++) {
      const prev = task.histories[i - 1];
      const curr = task.histories[i];
      if (prev.status === 'resolved' && (curr.status === 'open' || curr.status === 'worsened')) {
        alerts.push({
          taskId: task.id,
          title: task.title,
          type: 'regression',
          message: `이슈 재발 (${prev.build.name} → ${curr.build.name})`,
        });
      }
    }
  }

  return alerts;
}
