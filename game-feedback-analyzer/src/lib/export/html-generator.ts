import type {
  ClassificationResult,
  UserAdvocateResult,
  DesignAdvocateResult,
  SynthesisResult,
  Sentiment,
} from '@/types';

interface ExportData {
  buildName: string;
  buildDate: string;
  analysisLevel: string;
  totalResponses: number;
  classification: ClassificationResult;
  userAdvocate?: UserAdvocateResult;
  designAdvocate?: DesignAdvocateResult;
  synthesis?: SynthesisResult;
}

const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: '긍정',
  enthusiastic: '열광',
  constructive_negative: '건설적 부정',
  frustrated: '불만',
  neutral: '중립',
  mixed: '혼합',
};

export function generateAnalysisHTML(data: ExportData): string {
  const {
    buildName,
    buildDate,
    analysisLevel,
    totalResponses,
    classification,
    userAdvocate,
    designAdvocate,
    synthesis,
  } = data;

  const categorySummaryRows = Object.entries(classification.categorySummary)
    .map(([category, info]) => {
      const sentimentCells = Object.entries(info.sentimentBreakdown)
        .filter(([, count]) => count > 0)
        .map(
          ([s, count]) =>
            `<span class="badge badge-${s}">${SENTIMENT_LABELS[s as Sentiment] ?? s}: ${count}</span>`
        )
        .join(' ');

      return `
        <tr>
          <td>${category}</td>
          <td>${info.count}</td>
          <td>${sentimentCells}</td>
          <td>${info.topQuotes.slice(0, 2).map((q) => `<em>"${escapeHtml(q.slice(0, 80))}..."</em>`).join('<br/>')}</td>
        </tr>`;
    })
    .join('');

  const painPointsSection = userAdvocate
    ? `
    <h2>핵심 불만 사항</h2>
    <table>
      <thead>
        <tr><th>이슈</th><th>빈도</th><th>강도</th></tr>
      </thead>
      <tbody>
        ${userAdvocate.criticalPainPoints
          .map(
            (p) => `
          <tr>
            <td>${escapeHtml(p.issue)}</td>
            <td>${p.frequency}</td>
            <td><span class="badge badge-${p.intensity === 'high' ? 'frustrated' : p.intensity === 'medium' ? 'mixed' : 'neutral'}">${p.intensity}</span></td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h2>매력 요소</h2>
    <ul>
      ${userAdvocate.strongAttractions.map((a) => `<li><strong>${escapeHtml(a.element)}</strong></li>`).join('')}
    </ul>`
    : '';

  const directionSection = designAdvocate
    ? `
    <h2>방향성 갭 분석</h2>
    <table>
      <thead>
        <tr><th>영역</th><th>의도</th><th>실제 인식</th><th>유형</th></tr>
      </thead>
      <tbody>
        ${designAdvocate.directionGaps
          .map(
            (g) => `
          <tr>
            <td>${escapeHtml(g.area)}</td>
            <td>${escapeHtml(g.intended)}</td>
            <td>${escapeHtml(g.actual)}</td>
            <td><span class="badge badge-${g.gapType === 'design_failure' ? 'frustrated' : 'mixed'}">${g.gapType === 'design_failure' ? '설계 실패' : '전달 실패'}</span></td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h2>잘 전달된 요소</h2>
    <ul>
      ${designAdvocate.wellDelivered.map((w) => `<li><strong>${escapeHtml(w.element)}</strong>: ${w.evidence.map(escapeHtml).join(', ')}</li>`).join('')}
    </ul>`
    : '';

  const synthesisSection = synthesis
    ? `
    <h2>종합 결론</h2>
    <h3>합의 사항</h3>
    <table>
      <thead>
        <tr><th>이슈</th><th>합의 강도</th><th>권장 액션</th></tr>
      </thead>
      <tbody>
        ${synthesis.consensus
          .map(
            (c) => `
          <tr>
            <td>${escapeHtml(c.issue)}</td>
            <td><span class="badge badge-${c.strength === 'strong' ? 'positive' : 'neutral'}">${c.strength === 'strong' ? '강함' : '보통'}</span></td>
            <td>${escapeHtml(c.action)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h3>우선순위 랭킹</h3>
    <table>
      <thead>
        <tr><th>순위</th><th>이슈</th><th>점수</th><th>카테고리</th></tr>
      </thead>
      <tbody>
        ${synthesis.finalPriorityRanking
          .map(
            (r) => `
          <tr>
            <td>${r.rank}</td>
            <td>${escapeHtml(r.issue)}</td>
            <td>${r.score}</td>
            <td>${escapeHtml(r.category)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    ${
      synthesis.blindSpots.length > 0
        ? `<h3>사각지대</h3><ul>${synthesis.blindSpots.map((b) => `<li>[${b.source}] ${escapeHtml(b.insight)}</li>`).join('')}</ul>`
        : ''
    }`
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(buildName)} - 분석 리포트</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #14141E;
      color: #E8E0D0;
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 960px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; color: #E8E0D0; }
    h2 { font-size: 1.25rem; margin: 2rem 0 1rem; color: #82B1FF; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
    h3 { font-size: 1rem; margin: 1.5rem 0 0.75rem; color: #C8BCA8; }
    .meta { color: #8A8070; font-size: 0.875rem; margin-bottom: 2rem; }
    .meta span { margin-right: 1.5rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card {
      background: #1E1E2A;
      border: 1px solid #333;
      border-radius: 10px;
      padding: 1.25rem;
    }
    .stat-card .label { font-size: 0.75rem; color: #8A8070; }
    .stat-card .value { font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem; }
    .stat-card .value.positive { color: #A5D6A7; }
    .stat-card .value.accent { color: #82B1FF; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #333; }
    th { color: #8A8070; font-weight: 500; }
    td { color: #C8BCA8; }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      margin: 0.1rem;
    }
    .badge-positive { background: rgba(165,214,167,0.2); color: #A5D6A7; }
    .badge-enthusiastic { background: rgba(255,213,79,0.2); color: #FFD54F; }
    .badge-constructive_negative { background: rgba(130,177,255,0.2); color: #82B1FF; }
    .badge-frustrated { background: rgba(255,138,128,0.2); color: #FF8A80; }
    .badge-neutral { background: rgba(200,188,168,0.2); color: #C8BCA8; }
    .badge-mixed { background: rgba(206,147,216,0.2); color: #CE93D8; }
    ul { padding-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.5rem; color: #C8BCA8; }
    em { color: #8A8070; font-style: italic; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #333; color: #8A8070; font-size: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(buildName)} - 분석 리포트</h1>
    <div class="meta">
      <span>빌드 날짜: ${escapeHtml(buildDate)}</span>
      <span>분석 수준: ${escapeHtml(analysisLevel)}</span>
      <span>생성일: ${new Date().toISOString().slice(0, 10)}</span>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="label">총 응답 수</div>
        <div class="value">${totalResponses}</div>
      </div>
      <div class="stat-card">
        <div class="label">카테고리 수</div>
        <div class="value accent">${Object.keys(classification.categorySummary).length}</div>
      </div>
    </div>

    <h2>카테고리별 분석</h2>
    <table>
      <thead>
        <tr><th>카테고리</th><th>건수</th><th>감정 분포</th><th>주요 인용</th></tr>
      </thead>
      <tbody>${categorySummaryRows}</tbody>
    </table>

    ${painPointsSection}
    ${directionSection}
    ${synthesisSection}

    <div class="footer">
      Game Feedback Analyzer - 자동 생성 리포트
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
