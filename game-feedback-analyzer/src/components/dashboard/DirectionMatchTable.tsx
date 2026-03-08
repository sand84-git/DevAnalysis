'use client';

import type { DesignAdvocateResult } from '@/types';

interface DirectionMatchTableProps {
  directionGaps: DesignAdvocateResult['directionGaps'];
  directionConflicts: DesignAdvocateResult['directionConflicts'];
  wellDelivered: DesignAdvocateResult['wellDelivered'];
  identityAssessment: DesignAdvocateResult['identityAssessment'];
}

const GAP_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  design_failure: { label: '설계 실패', className: 'bg-danger/20 text-danger' },
  delivery_failure: { label: '전달 실패', className: 'bg-warn/20 text-warn' },
};

const IDENTITY_STYLES: Record<string, { label: string; className: string }> = {
  strong: { label: '강함', className: 'bg-success/20 text-success' },
  partial: { label: '부분적', className: 'bg-warn/20 text-warn' },
  weak: { label: '약함', className: 'bg-danger/20 text-danger' },
};

export default function DirectionMatchTable({
  directionGaps,
  directionConflicts,
  wellDelivered,
  identityAssessment,
}: DirectionMatchTableProps) {
  const identityStyle = IDENTITY_STYLES[identityAssessment];

  return (
    <div className="space-y-6">
      {/* Identity Assessment */}
      <div className="rounded-[10px] border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg text-text">게임 아이덴티티 평가</h3>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${identityStyle.className}`}>
            {identityStyle.label}
          </span>
        </div>
      </div>

      {/* Direction Gaps */}
      <div className="rounded-[10px] border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-lg text-text">방향성 갭 분석</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-text-mid">영역</th>
                <th className="py-2 text-left font-medium text-text-mid">의도</th>
                <th className="py-2 text-left font-medium text-text-mid">실제 인식</th>
                <th className="py-2 text-left font-medium text-text-mid">유형</th>
              </tr>
            </thead>
            <tbody>
              {directionGaps.map((gap) => {
                const gapStyle = GAP_TYPE_STYLES[gap.gapType];
                return (
                  <tr key={gap.area} className="border-b border-border/50">
                    <td className="py-3 font-medium text-text">{gap.area}</td>
                    <td className="py-3 text-text-mid">{gap.intended}</td>
                    <td className="py-3 text-text-mid">{gap.actual}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${gapStyle.className}`}>
                        {gapStyle.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direction Conflicts */}
      {directionConflicts.length > 0 && (
        <div className="rounded-[10px] border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-lg text-text">방향성 충돌</h3>
          <div className="space-y-4">
            {directionConflicts.map((conflict, i) => (
              <div key={i} className="rounded-lg border border-border/50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-medium text-text-lt">유저 요구</span>
                    <p className="mt-1 text-text">{conflict.userDemand}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-lt">기획 방향</span>
                    <p className="mt-1 text-text">{conflict.designDirection}</p>
                  </div>
                </div>
                <div className="mt-3 rounded bg-accent2/10 px-3 py-2">
                  <span className="text-xs font-medium text-accent2">권장 사항</span>
                  <p className="mt-0.5 text-sm text-text">{conflict.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Well Delivered */}
      {wellDelivered.length > 0 && (
        <div className="rounded-[10px] border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-lg text-text">잘 전달된 요소</h3>
          <div className="space-y-3">
            {wellDelivered.map((item) => (
              <div key={item.element} className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-success" />
                <div>
                  <p className="font-medium text-text">{item.element}</p>
                  <p className="mt-1 text-xs text-text-lt">
                    근거: {item.evidence.join(' / ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
