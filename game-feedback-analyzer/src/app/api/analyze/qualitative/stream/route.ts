import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { runQualitativeAnalysis } from '@/lib/analysis/qualitative';
import type { OnStageChange } from '@/lib/analysis/qualitative';
import type { AnalysisLevel } from '@/types';

export const maxDuration = 300; // 5 minutes max for long analyses

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { buildId, level } = body as { buildId: string; level: AnalysisLevel };

  if (!buildId || !level) {
    return new Response(
      JSON.stringify({ error: 'buildId and level required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: {
      project: { include: { categories: true } },
      responses: true,
    },
  });

  if (!build) {
    return new Response(
      JSON.stringify({ error: 'Build not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (build.responses.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No feedback responses to analyze' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const responses = build.responses.map((r) => ({
    id: r.id,
    text: r.text,
  }));

  const categories = build.project.categories.map((c) => c.name);

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (data: object) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // Stream closed
    }
  };

  // Run analysis in background, streaming progress
  // 단계별 부분 결과를 누적하여 오류 시에도 완료된 단계까지 DB에 저장
  (async () => {
    const partialResult: Record<string, unknown> = {};

    const onStageChange: OnStageChange = async (event) => {
      sendEvent(event);

      // 단계 완료 시 즉시 DB에 부분 결과 저장
      if (event.status === 'completed' && event.data) {
        Object.assign(partialResult, event.data);

        try {
          // 분류 완료 시: FeedbackResponse 업데이트 + BuildAnalysis 생성
          if (event.stage === 'classify' && partialResult.classification) {
            const classification = partialResult.classification as {
              classifiedResponses: Array<{
                id: string;
                categories: string[];
                sentiment: string;
                confidence: number;
                summary: string;
              }>;
            };

            await prisma.$transaction([
              prisma.buildAnalysis.upsert({
                where: { buildId },
                update: {
                  analysisLevel: level,
                  qualitativeJson: JSON.stringify(partialResult),
                  analyzedAt: new Date(),
                },
                create: {
                  buildId,
                  analysisLevel: level,
                  qualitativeJson: JSON.stringify(partialResult),
                },
              }),
              ...classification.classifiedResponses.map((classified) =>
                prisma.feedbackResponse.update({
                  where: { id: classified.id },
                  data: {
                    categories: JSON.stringify(classified.categories),
                    sentiment: classified.sentiment,
                    confidence: classified.confidence,
                    summary: classified.summary,
                  },
                })
              ),
            ]);
          }

          // 이후 단계 완료 시: BuildAnalysis만 업데이트 (누적 결과)
          if (event.stage !== 'classify') {
            await prisma.buildAnalysis.update({
              where: { buildId },
              data: {
                qualitativeJson: JSON.stringify(partialResult),
                analyzedAt: new Date(),
              },
            });
          }
        } catch (dbErr) {
          console.error(`[Analysis] DB save failed at stage ${event.stage}:`, dbErr);
        }
      }
    };

    try {
      const result = await runQualitativeAnalysis(
        {
          responses,
          categories,
          directionDoc: build.project.directionDoc || undefined,
          analysisLevel: level,
          buildId,
        },
        onStageChange
      );

      // Send final result
      await sendEvent({ stage: 'done', status: 'completed', result });
    } catch (err) {
      // 오류 발생해도 이미 완료된 단계의 결과는 DB에 저장되어 있음
      const failedStage = Object.keys(partialResult).length > 0
        ? '부분 분석 결과가 저장되었습니다.'
        : '';
      await sendEvent({
        stage: 'error',
        status: 'error',
        detail: `${err instanceof Error ? err.message : 'Unknown error'}${failedStage ? ` (${failedStage})` : ''}`,
      });
    } finally {
      try {
        await writer.close();
      } catch {
        // Already closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
