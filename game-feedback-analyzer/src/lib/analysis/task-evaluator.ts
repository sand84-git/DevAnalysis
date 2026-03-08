import { callClaude, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import { loadPrompt } from '@/lib/analysis/prompt-loader';
import type { TaskEvaluation } from '@/types';

export interface TaskForEvaluation {
  title: string;
  description?: string;
  section?: string;
  currentStatus: string;
  priority: string;
}

export interface TaskHistoryEntry {
  buildId: string;
  buildName: string;
  status: string;
  note?: string;
}

export interface TaskEvaluatorInput {
  task: TaskForEvaluation;
  analysisResult: {
    qualitative: string;
    quantitative?: string;
  };
  taskHistory?: TaskHistoryEntry[];
  buildId?: string;
}

export async function evaluateTask(
  input: TaskEvaluatorInput
): Promise<TaskEvaluation> {
  const systemPrompt = await loadPrompt('evaluate-task-multi.md');

  const userMessage = JSON.stringify({
    task: input.task,
    analysisResult: {
      qualitative: JSON.parse(input.analysisResult.qualitative),
      quantitative: input.analysisResult.quantitative
        ? JSON.parse(input.analysisResult.quantitative)
        : null,
    },
    taskHistory: input.taskHistory ?? [],
  });

  const response = await callClaude(systemPrompt, userMessage, 'sonnet', {
    maxTokens: 2048,
  });

  await logAPICost(response, {
    agent: 'task-evaluator',
    buildId: input.buildId,
  });

  return parseJsonResponse<TaskEvaluation>(response);
}
