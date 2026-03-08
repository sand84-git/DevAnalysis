import { callClaude, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type { CrossBuildResult } from '@/types';

export interface BuildAnalysisData {
  buildId: string;
  buildName: string;
  date: string;
  testType?: string;
  changes?: string;
  notes?: string;
  qualitativeJson: string;
  quantitativeJson?: string;
}

export interface CrossBuildInput {
  builds: BuildAnalysisData[];
  projectId?: string;
}

export async function compareBuildResults(
  input: CrossBuildInput
): Promise<CrossBuildResult> {
  const systemPrompt = await loadPrompt('cross-build-multi.md');

  const userMessage = JSON.stringify({
    builds: input.builds.map((b) => ({
      id: b.buildId,
      name: b.buildName,
      date: b.date,
      testType: b.testType,
      changes: b.changes,
      notes: b.notes,
    })),
    analyses: input.builds.map((b) => ({
      buildId: b.buildId,
      qualitative: JSON.parse(b.qualitativeJson),
      quantitative: b.quantitativeJson ? JSON.parse(b.quantitativeJson) : null,
    })),
  });

  const response = await callClaude(systemPrompt, userMessage, 'opus', {
    maxTokens: 8192,
  });

  await logAPICost(response, {
    agent: 'cross-build',
  });

  return parseJsonResponse<CrossBuildResult>(response);
}
