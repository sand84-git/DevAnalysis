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

const SENTIMENT_EMOJI: Record<Sentiment, string> = {
  positive: ':white_check_mark:',
  enthusiastic: ':star2:',
  constructive_negative: ':thought_balloon:',
  frustrated: ':warning:',
  neutral: ':grey_question:',
  mixed: ':arrows_counterclockwise:',
};

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text: string; emoji?: boolean }>;
  fields?: Array<{ type: string; text: string }>;
}

export function formatForSlack(data: ExportData): {
  text: string;
  blocks: SlackBlock[];
} {
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

  const blocks: SlackBlock[] = [];

  // Header
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `${buildName} - 피드백 분석 리포트`,
      emoji: true,
    },
  });

  // Meta
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `:calendar: ${buildDate}  |  :bar_chart: ${analysisLevel}  |  :busts_in_silhouette: 응답 ${totalResponses}건`,
      },
    ],
  });

  blocks.push({ type: 'divider' });

  // Category summary
  const topCategories = Object.entries(classification.categorySummary)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  const categoryLines = topCategories
    .map(([cat, info]) => {
      const dominantSentiment = Object.entries(info.sentimentBreakdown).sort(
        ([, a], [, b]) => b - a
      )[0];
      const emoji = dominantSentiment
        ? SENTIMENT_EMOJI[dominantSentiment[0] as Sentiment] ?? ''
        : '';
      return `${emoji} *${cat}*: ${info.count}건`;
    })
    .join('\n');

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*:clipboard: 주요 카테고리*\n${categoryLines}`,
    },
  });

  // Pain points
  if (userAdvocate && userAdvocate.criticalPainPoints.length > 0) {
    blocks.push({ type: 'divider' });

    const painLines = userAdvocate.criticalPainPoints
      .slice(0, 5)
      .map((p) => {
        const intensityEmoji =
          p.intensity === 'high'
            ? ':red_circle:'
            : p.intensity === 'medium'
              ? ':large_orange_circle:'
              : ':white_circle:';
        return `${intensityEmoji} ${p.issue} (빈도: ${p.frequency})`;
      })
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*:rotating_light: 핵심 불만 사항*\n${painLines}`,
      },
    });
  }

  // Strong attractions
  if (userAdvocate && userAdvocate.strongAttractions.length > 0) {
    const attractionLines = userAdvocate.strongAttractions
      .slice(0, 3)
      .map((a) => `:sparkles: ${a.element}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*:heart_eyes: 매력 요소*\n${attractionLines}`,
      },
    });
  }

  // Direction gaps
  if (designAdvocate && designAdvocate.directionGaps.length > 0) {
    blocks.push({ type: 'divider' });

    const gapLines = designAdvocate.directionGaps
      .map(
        (g) =>
          `:warning: *${g.area}*\n    의도: ${g.intended}\n    실제: ${g.actual}`
      )
      .join('\n\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*:dart: 방향성 갭*\n${gapLines}`,
      },
    });
  }

  // Synthesis
  if (synthesis) {
    blocks.push({ type: 'divider' });

    // Priority ranking
    if (synthesis.finalPriorityRanking.length > 0) {
      const rankLines = synthesis.finalPriorityRanking
        .slice(0, 5)
        .map((r) => {
          const medal =
            r.rank === 1
              ? ':first_place_medal:'
              : r.rank === 2
                ? ':second_place_medal:'
                : r.rank === 3
                  ? ':third_place_medal:'
                  : `:keycap_${r.rank}:`;
          return `${medal} *${r.issue}* (${r.score}점) - ${r.category}`;
        })
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*:trophy: 우선순위 랭킹*\n${rankLines}`,
        },
      });
    }

    // Action items from consensus
    if (synthesis.consensus.length > 0) {
      const actionLines = synthesis.consensus
        .map(
          (c) =>
            `${c.strength === 'strong' ? ':large_green_circle:' : ':large_blue_circle:'} *${c.issue}*\n    :arrow_right: ${c.action}`
        )
        .join('\n\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*:memo: 액션 아이템*\n${actionLines}`,
        },
      });
    }
  }

  // Footer
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '_Game Feedback Analyzer - 자동 생성 리포트_',
      },
    ],
  });

  // Plain text fallback
  const text = `${buildName} 분석 리포트 - 응답 ${totalResponses}건, ${Object.keys(classification.categorySummary).length}개 카테고리`;

  return { text, blocks };
}
