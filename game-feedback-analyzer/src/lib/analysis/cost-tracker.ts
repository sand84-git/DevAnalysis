import { prisma } from '@/lib/db';

/** Shape expected from Claude API response for cost tracking */
export interface ClaudeResponseCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUSD: number;
}

export async function logAPICost(
  response: ClaudeResponseCost,
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

  const totalCost = logs.reduce((sum, log) => sum + log.costUSD, 0);
  const byAgent = logs.reduce(
    (acc, log) => {
      acc[log.agent] = (acc[log.agent] || 0) + log.costUSD;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalCost,
    byAgent,
    callCount: logs.length,
  };
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

  const totalCost = logs.reduce((sum, log) => sum + log.costUSD, 0);
  const byAgent = logs.reduce(
    (acc, log) => {
      acc[log.agent] = (acc[log.agent] || 0) + log.costUSD;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalCost,
    byAgent,
    callCount: logs.length,
    period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  };
}
