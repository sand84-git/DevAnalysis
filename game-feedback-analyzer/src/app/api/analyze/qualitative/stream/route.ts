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
  (async () => {
    try {
      const onStageChange: OnStageChange = (event) => {
        sendEvent(event);
      };

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

      // Save analysis to DB
      await prisma.buildAnalysis.upsert({
        where: { buildId },
        update: {
          analysisLevel: level,
          qualitativeJson: JSON.stringify(result),
          analyzedAt: new Date(),
        },
        create: {
          buildId,
          analysisLevel: level,
          qualitativeJson: JSON.stringify(result),
        },
      });

      // Update classified responses
      for (const classified of result.classification.classifiedResponses) {
        await prisma.feedbackResponse.update({
          where: { id: classified.id },
          data: {
            categories: JSON.stringify(classified.categories),
            sentiment: classified.sentiment,
            confidence: classified.confidence,
            summary: classified.summary,
          },
        });
      }

      // Send final result
      await sendEvent({ stage: 'done', status: 'completed', result });
    } catch (err) {
      await sendEvent({
        stage: 'error',
        status: 'error',
        detail: err instanceof Error ? err.message : 'Unknown error',
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
