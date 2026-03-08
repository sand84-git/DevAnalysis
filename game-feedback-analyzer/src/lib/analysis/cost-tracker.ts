import { prisma } from '@/lib/db';
import type { ClaudeResponse } from '@/lib/claude';

export async function logAPICost(
  response: ClaudeResponse,
  context: {
    agent: string;
    buildId?: string;
    analysisLevel?: string;
  }
): Promise<void> {
  await prisma.aPICallLog.create({
    data: {
      agent: context.agent,
      model: response.model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      cachedTokens: response.cacheReadTokens,
      costUSD: response.costUSD,
      buildId: context.buildId,
      analysisLevel: context.analysisLevel,
    },
  });
}

export async function getBuildCostSummary(buildId: string) {
  const logs = await prisma.aPICallLog.findMany({
    where: { buildId },
    orderBy: { timestamp: 'desc' },
  });

  let totalCost = 0;
  const byAgent: Record<string, number> = {};
  for (const log of logs) {
    totalCost += log.costUSD;
    byAgent[log.agent] = (byAgent[log.agent] || 0) + log.costUSD;
  }

  return { totalCost, byAgent, callCount: logs.length };
}

export async function getMonthlyCostSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const logs = await prisma.aPICallLog.findMany({
    where: {
      timestamp: { gte: startOfMonth },
    },
    orderBy: { timestamp: 'desc' },
  });

  let totalCost = 0;
  const byAgent: Record<string, number> = {};
  for (const log of logs) {
    totalCost += log.costUSD;
    byAgent[log.agent] = (byAgent[log.agent] || 0) + log.costUSD;
  }

  return {
    totalCost,
    byAgent,
    callCount: logs.length,
    period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  };
}
