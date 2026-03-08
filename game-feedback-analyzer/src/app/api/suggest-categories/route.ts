import { NextRequest, NextResponse } from 'next/server';
import { callLLM, parseJsonResponse } from '@/lib/claude';

const SYSTEM_PROMPT = `당신은 게임 유저 피드백 분석 전문가입니다.
게임 기획 방향 문서를 분석하여 유저 피드백 분류에 적합한 카테고리를 제안합니다.

## 카테고리 설계 원칙
1. 게임의 핵심 경험과 직접 관련된 카테고리를 우선 제안
2. 너무 넓지 않고 (예: "게임플레이") 너무 좁지 않은 (예: "3번째 보스 밸런스") 적절한 수준
3. 유저 피드백에서 자주 언급될 수 있는 영역 중심
4. 일반적 참고 예시: 조작감, 밸런스, UI/UX, 그래픽, 성능, 튜토리얼, 콘텐츠 볼륨, 소셜 기능, 과금, 스토리

## 규칙
- 기획 문서의 내용을 기반으로 해당 게임에 맞는 5~10개 카테고리를 제안하세요
- 카테고리 이름은 간결하게 (2~4단어)
- 한국어로 작성

## 출력 형식
반드시 아래 JSON 형식으로만 출력하세요:
\`\`\`json
{ "categories": ["카테고리1", "카테고리2", ...] }
\`\`\``;

export async function POST(req: NextRequest) {
  try {
    const { directionDoc } = await req.json();

    if (!directionDoc || typeof directionDoc !== 'string' || !directionDoc.trim()) {
      return NextResponse.json({ error: 'directionDoc is required' }, { status: 400 });
    }

    const response = await callLLM(SYSTEM_PROMPT, directionDoc, 'grok', { maxTokens: 1024 });
    const result = parseJsonResponse<{ categories: string[] }>(response);

    if (!Array.isArray(result.categories)) {
      return NextResponse.json({ error: 'Invalid response from LLM' }, { status: 500 });
    }

    return NextResponse.json({ categories: result.categories });
  } catch (error) {
    console.error('Category suggestion failed:', error);
    return NextResponse.json(
      { error: 'Failed to suggest categories' },
      { status: 500 }
    );
  }
}
