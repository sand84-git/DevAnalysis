import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: {
      feedbackFiles: true,
      responses: true,
      analysis: true,
      taskHistories: { include: { task: true } },
    },
  });

  if (!build) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(build);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;
  const body = await req.json();

  if (body.changes) body.changes = JSON.stringify(body.changes);
  if (body.biasProfile) body.biasProfile = JSON.stringify(body.biasProfile);
  if (body.date) body.date = new Date(body.date);

  const build = await prisma.build.update({
    where: { id: buildId },
    data: body,
  });

  return NextResponse.json(build);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;
  await prisma.build.delete({ where: { id: buildId } });
  return NextResponse.json({ success: true });
}
