import { ProjectSidebar } from '@/components/layout/ProjectSidebar';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex min-h-screen">
      <ProjectSidebar projectId={projectId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
