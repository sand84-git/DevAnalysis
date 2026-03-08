import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const raw = await prisma.project.findMany({
    include: {
      builds: { orderBy: { order: 'desc' }, take: 1 },
      tasks: { where: { currentStatus: 'open' } },
      _count: { select: { builds: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const projects = raw.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    buildCount: p._count.builds,
    openTaskCount: p.tasks.length,
    latestBuildName: p.builds[0]?.name ?? undefined,
  }));

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, directionDoc, categories } = body;

  if (!name || !directionDoc) {
    return NextResponse.json(
      { error: 'name and directionDoc are required' },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      directionDoc,
      categories: categories?.length
        ? { create: categories.map((c: string | { name: string; group?: string }, i: number) => ({
            name: typeof c === 'string' ? c : c.name,
            group: typeof c === 'string' ? undefined : c.group,
            order: i,
          })) }
        : undefined,
    },
    include: { categories: true },
  });

  return NextResponse.json(project, { status: 201 });
}
