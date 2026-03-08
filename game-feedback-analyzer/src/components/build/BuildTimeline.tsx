import { BuildCard } from './BuildCard';
import { cn } from '@/lib/utils';

interface BuildItem {
  id: string;
  name: string;
  date: string;
  testType?: string | null;
  feedbackCount: number;
  analysisStatus: string;
}

interface BuildTimelineProps {
  projectId: string;
  builds: BuildItem[];
  className?: string;
}

export function BuildTimeline({
  projectId,
  builds,
  className,
}: BuildTimelineProps) {
  if (builds.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-text-lt">
          아직 빌드가 없습니다. 새 빌드를 추가해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical timeline line */}
      <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {builds.map((build, i) => (
          <div key={build.id} className="relative flex items-start gap-5 pl-0">
            {/* Timeline dot */}
            <div
              className={cn(
                'relative z-10 mt-5 size-[15px] shrink-0 rounded-full border-2 border-card',
                i === 0 ? 'bg-accent1' : 'bg-border'
              )}
            />

            {/* Build card */}
            <div className="flex-1">
              <BuildCard
                id={build.id}
                projectId={projectId}
                name={build.name}
                date={build.date}
                testType={build.testType}
                feedbackCount={build.feedbackCount}
                analysisStatus={build.analysisStatus}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
