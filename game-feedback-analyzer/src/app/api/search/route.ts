import { NextRequest, NextResponse } from 'next/server';
import { searchFeedback } from '@/lib/search/feedback-search';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get('projectId');
  const query = searchParams.get('q');

  if (!projectId || !query) {
    return NextResponse.json({ error: 'projectId and q required' }, { status: 400 });
  }

  const result = await searchFeedback({
    projectId,
    query,
    buildIds: searchParams.get('buildIds')?.split(','),
    categories: searchParams.get('categories')?.split(','),
    sentiments: searchParams.get('sentiments')?.split(','),
    languages: searchParams.get('languages')?.split(','),
    limit: Number(searchParams.get('limit') ?? 50),
    offset: Number(searchParams.get('offset') ?? 0),
  });

  return NextResponse.json(result);
}
