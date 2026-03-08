/**
 * Grok vs Claude 비용 비교 테스트
 * 10개 샘플 피드백으로 Classifier를 Grok/Claude 각각 호출하여 비용과 품질 비교
 *
 * 실행: npx tsx scripts/test-grok-cost.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { callLLM, callClaude, parseJsonResponse } from '../src/lib/claude';
import { loadPrompt } from '../src/lib/analysis/prompt-loader';

const SAMPLE_FEEDBACKS = [
  { id: '1', text: '전투 시스템이 정말 재미있어요! 콤보 연결이 매끄럽고 타격감이 좋습니다.' },
  { id: '2', text: '밸런스가 너무 안 맞아요. 특정 캐릭터만 쓰면 이기고 나머지는 쓸모없음.' },
  { id: '3', text: '튜토리얼이 좀 더 자세했으면 좋겠어요. 스킬 설명이 부족합니다.' },
  { id: '4', text: '렉이 심해서 못하겠어요. PvP에서 핑 200 넘으면 게임 안됨.' },
  { id: '5', text: '그래픽은 예쁜데 최적화가 아쉬워요. 폰이 뜨거워지고 배터리가 빨리 닳아요.' },
  { id: '6', text: '가챠 확률이 너무 낮아요ㅋㅋ 100연차 해도 SSR 못뽑음 ㅡㅡ' },
  { id: '7', text: '스토리가 몰입감 있어서 좋아요. 세계관 설정이 탄탄합니다.' },
  { id: '8', text: '자동 전투 기능 추가해주세요. 파밍할 때 수동은 너무 피곤해요.' },
  { id: '9', text: '길드 시스템이 잘 되어있네요. 길드전이 특히 재밌습니다!' },
  { id: '10', text: '이벤트가 너무 적어요. 매주 같은 패턴이라 지루합니다.' },
];

const CATEGORIES = ['전투', '밸런스', '최적화', '콘텐츠', 'UI/UX', '과금', '스토리'];

async function runTest() {
  console.log('=== Grok vs Claude 비용 비교 테스트 ===\n');
  console.log(`샘플: ${SAMPLE_FEEDBACKS.length}개 피드백\n`);

  const systemPrompt = await loadPrompt('agent1-classifier.md');
  const userMessage = JSON.stringify({
    responses: SAMPLE_FEEDBACKS,
    categories: CATEGORIES,
  });

  // 1. Grok으로 분류
  console.log('--- Grok 4.1 Fast ---');
  const grokStart = Date.now();
  const grokResponse = await callLLM(systemPrompt, userMessage, 'grok', { maxTokens: 8192 });
  const grokTime = Date.now() - grokStart;

  console.log(`  시간: ${(grokTime / 1000).toFixed(1)}s`);
  console.log(`  Input: ${grokResponse.inputTokens} tokens`);
  console.log(`  Output: ${grokResponse.outputTokens} tokens`);
  console.log(`  비용: $${grokResponse.costUSD.toFixed(6)}`);

  let grokResult;
  try {
    grokResult = parseJsonResponse(grokResponse);
    console.log(`  JSON 파싱: ✅ 성공`);
    const gr = grokResult as { classifiedResponses: Array<{ id: string; categories: string[]; sentiment: string }> };
    console.log(`  분류된 응답 수: ${gr.classifiedResponses?.length ?? 0}`);
  } catch (e) {
    console.log(`  JSON 파싱: ❌ 실패 - ${(e as Error).message}`);
    console.log(`  Raw output (첫 500자):\n${grokResponse.content.slice(0, 500)}`);
  }

  // 2. Claude Sonnet으로 분류
  console.log('\n--- Claude Sonnet 4.6 ---');
  const claudeStart = Date.now();
  const claudeResponse = await callClaude(systemPrompt, userMessage, 'sonnet', { maxTokens: 8192 });
  const claudeTime = Date.now() - claudeStart;

  console.log(`  시간: ${(claudeTime / 1000).toFixed(1)}s`);
  console.log(`  Input: ${claudeResponse.inputTokens} tokens`);
  console.log(`  Output: ${claudeResponse.outputTokens} tokens`);
  console.log(`  비용: $${claudeResponse.costUSD.toFixed(6)}`);

  let claudeResult;
  try {
    claudeResult = parseJsonResponse(claudeResponse);
    console.log(`  JSON 파싱: ✅ 성공`);
    const cr = claudeResult as { classifiedResponses: Array<{ id: string; categories: string[]; sentiment: string }> };
    console.log(`  분류된 응답 수: ${cr.classifiedResponses?.length ?? 0}`);
  } catch (e) {
    console.log(`  JSON 파싱: ❌ 실패 - ${(e as Error).message}`);
  }

  // 3. 비교
  console.log('\n=== 비교 결과 ===');
  console.log(`  비용 차이: Grok $${grokResponse.costUSD.toFixed(6)} vs Claude $${claudeResponse.costUSD.toFixed(6)}`);
  console.log(`  비용 비율: Grok은 Claude의 ${((grokResponse.costUSD / claudeResponse.costUSD) * 100).toFixed(1)}%`);
  console.log(`  속도: Grok ${(grokTime / 1000).toFixed(1)}s vs Claude ${(claudeTime / 1000).toFixed(1)}s`);

  // 4. 100개 응답 기준 예상 비용 (10개 → 100개 스케일)
  const scale = 100 / SAMPLE_FEEDBACKS.length;
  console.log(`\n=== 100개 응답 기준 예상 비용 ===`);
  console.log(`  Grok Classifier:  $${(grokResponse.costUSD * scale * 2).toFixed(4)} (2배치)`);
  console.log(`  Claude Classifier: $${(claudeResponse.costUSD * scale * 2).toFixed(4)} (2배치)`);

  // 5. 품질 비교 (카테고리 & 감정 일치율)
  if (grokResult && claudeResult) {
    const gr = grokResult as { classifiedResponses: Array<{ id: string; categories: string[]; sentiment: string }> };
    const cr = claudeResult as { classifiedResponses: Array<{ id: string; categories: string[]; sentiment: string }> };

    if (gr.classifiedResponses && cr.classifiedResponses) {
      let categoryMatch = 0;
      let sentimentMatch = 0;
      const total = Math.min(gr.classifiedResponses.length, cr.classifiedResponses.length);

      for (let i = 0; i < total; i++) {
        const gItem = gr.classifiedResponses.find(r => r.id === cr.classifiedResponses[i].id);
        const cItem = cr.classifiedResponses[i];
        if (!gItem) continue;

        // 카테고리 교집합 비율
        const gCats = new Set(gItem.categories);
        const cCats = new Set(cItem.categories);
        const overlap = [...gCats].filter(c => cCats.has(c)).length;
        const union = new Set([...gCats, ...cCats]).size;
        if (union > 0) categoryMatch += overlap / union;

        // 감정 일치
        if (gItem.sentiment === cItem.sentiment) sentimentMatch++;
      }

      console.log(`\n=== 품질 비교 ===`);
      console.log(`  카테고리 일치율 (Jaccard): ${((categoryMatch / total) * 100).toFixed(1)}%`);
      console.log(`  감정 일치율: ${((sentimentMatch / total) * 100).toFixed(1)}%`);
      console.log(`  (80% 이상이면 Grok 사용 권장)`);
    }
  }
}

runTest().catch(console.error);
