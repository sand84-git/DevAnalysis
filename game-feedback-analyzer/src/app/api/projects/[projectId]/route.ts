import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      builds: { orderBy: { order: 'asc' } },
      categories: { orderBy: { order: 'asc' } },
      tasks: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json();
  const { categories, ...scalarFields } = body;

  const project = await prisma.$transaction(async (tx) => {
    if (Object.keys(scalarFields).length > 0) {
      await tx.project.update({ where: { id: projectId }, data: scalarFields });
    }

    if (Array.isArray(categories)) {
      await tx.category.deleteMany({ where: { projectId } });
      if (categories.length > 0) {
        await tx.category.createMany({
          data: categories.map((name: string, i: number) => ({
            name,
            projectId,
            order: i,
          })),
        });
      }
    }

    return tx.project.findUnique({
      where: { id: projectId },
      include: {
        builds: { orderBy: { order: 'asc' } },
        categories: { orderBy: { order: 'asc' } },
        tasks: true,
      },
    });
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ success: true });
}
