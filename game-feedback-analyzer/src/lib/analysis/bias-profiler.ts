import type { BiasProfile, TestType } from '@/types';

const BIAS_PROFILES: Record<TestType, BiasProfile> = {
  field_test: {
    expectedPositiveRatio: 0.45,
    expectedNegativeRatio: 0.35,
    biasType: 'moderate_positive',
    description:
      '필드 테스트 참가자는 자발적으로 참여하므로 약간의 긍정 편향이 있을 수 있습니다. ' +
      '그러나 실제 플레이 환경이므로 현실적인 피드백을 기대할 수 있습니다.',
  },
  internal: {
    expectedPositiveRatio: 0.55,
    expectedNegativeRatio: 0.2,
    biasType: 'strong_positive',
    description:
      '내부 테스트는 개발팀 또는 관계자가 참여하므로 강한 긍정 편향이 있습니다. ' +
      '부정적 피드백은 실제보다 적게 나타날 수 있으며, 비판적 의견에 더 높은 가중치를 두어야 합니다.',
  },
  fgt: {
    expectedPositiveRatio: 0.4,
    expectedNegativeRatio: 0.35,
    biasType: 'selection_bias',
    description:
      'FGT(Focus Group Test) 참가자는 선별된 그룹이므로 선택 편향이 있습니다. ' +
      '특정 타겟 유저를 대표하지만, 전체 유저를 대표하지 않을 수 있습니다.',
  },
  cbt: {
    expectedPositiveRatio: 0.35,
    expectedNegativeRatio: 0.4,
    biasType: 'early_adopter',
    description:
      'CBT(Closed Beta Test) 참가자는 얼리 어답터 경향이 강합니다. ' +
      '일반 유저보다 관대하거나 까다로울 수 있으며, 기술적 이슈에 더 민감합니다.',
  },
  soft_launch: {
    expectedPositiveRatio: 0.35,
    expectedNegativeRatio: 0.4,
    biasType: 'market_representative',
    description:
      '소프트 런칭은 실제 시장 환경에 가장 가깝습니다. ' +
      '과금 관련 피드백이 포함되며, 유저 이탈 데이터와 교차 분석이 중요합니다.',
  },
  other: {
    expectedPositiveRatio: 0.4,
    expectedNegativeRatio: 0.35,
    biasType: 'unknown',
    description:
      '테스트 유형이 지정되지 않았습니다. 바이어스 프로파일을 기본값으로 설정합니다.',
  },
};

export function getBiasProfile(testType: TestType): BiasProfile {
  return BIAS_PROFILES[testType] ?? BIAS_PROFILES.other;
}
