import { prisma } from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';

interface SearchParams {
  projectId: string;
  query: string;
  buildIds?: string[];
  categories?: string[];
  sentiments?: string[];
  languages?: string[];
  limit?: number;
  offset?: number;
}

export async function searchFeedback(params: SearchParams) {
  const { projectId, query, buildIds, categories, sentiments, languages, limit = 50, offset = 0 } = params;

  // SQLite에서는 LIKE로 검색 (PostgreSQL에서는 tsvector로 교체)
  const where: Prisma.FeedbackResponseWhereInput = {
    build: { projectId },
    text: { contains: query },
  };

  if (buildIds?.length) {
    where.buildId = { in: buildIds };
  }

  if (sentiments?.length) {
    where.sentiment = { in: sentiments };
  }

  if (languages?.length) {
    where.language = { in: languages };
  }

  const results = await prisma.feedbackResponse.findMany({
    where,
    include: {
      build: { select: { id: true, name: true, date: true } },
    },
    take: limit,
    skip: offset,
    orderBy: { build: { date: 'desc' } },
  });

  // 카테고리 필터 (JSON string 내 검색)
  let filtered = results;
  if (categories?.length) {
    filtered = results.filter((r) => {
      if (!r.categories) return false;
      const cats = JSON.parse(r.categories) as string[];
      return categories.some((c) => cats.includes(c));
    });
  }

  const total = await prisma.feedbackResponse.count({ where });

  return {
    results: filtered,
    total,
    limit,
    offset,
  };
}
