import { RiArrowLeftLine, RiRouteFill } from 'react-icons/ri';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HeaderNavigation } from '@/components/header-navigation/header-navigation';
import { PageMeta } from '@/components/page-meta';
import { Button } from '@/components/primitives/button';
import { Skeleton } from '@/components/primitives/skeleton';
import { SideNavigation } from '@/components/side-navigation/side-navigation';
import { StudioWorkflowCanvas } from '@/components/studio/studio-workflow-canvas';
import { useWorkflow } from '@/hooks/use-bridge-api';
import { ROUTES } from '@/utils/routes';

export function StudioWorkflowDetailPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: workflow, isPending, isError } = useWorkflow(workflowId || '');

  const handleBack = () => {
    const searchParams = new URLSearchParams(location.search);
    navigate({
      pathname: ROUTES.STUDIO,
      search: searchParams.toString(),
    });
  };

  if (isPending) {
    return (
      <>
        <PageMeta title="Loading..." />
        <div className="flex h-screen w-full">
          <SideNavigation />
          <div className="flex flex-1 flex-col">
            <HeaderNavigation />
            <main className="flex flex-1 items-center justify-center">
              <Skeleton className="h-full w-full" />
            </main>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageMeta title="Workflow Not Found" />
        <div className="flex h-screen w-full">
          <SideNavigation />
          <div className="flex flex-1 flex-col">
            <HeaderNavigation />
            <main className="flex flex-1 items-center justify-center p-6">
              <div className="flex max-w-md flex-col items-center gap-4 text-center">
                <div className="flex flex-col gap-2">
                  <h2 className="text-foreground-950 text-xl font-semibold">Workflow Not Found</h2>
                  <p className="text-foreground-600 text-sm">
                    The workflow you're looking for doesn't exist or has been removed.
                  </p>
                </div>
                <Button onClick={handleBack}>Back to Studio</Button>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  if (!workflow) {
    return null;
  }

  const title = workflow.name || workflow.workflowId;

  return (
    <>
      <PageMeta title={title} />
      <div className="flex h-screen w-full">
        <SideNavigation />
        <div className="flex flex-1 flex-col">
          <HeaderNavigation
            startItems={
              <div className="flex items-center gap-2">
                <Button variant="secondary" mode="ghost" size="2xs" onClick={handleBack}>
                  <RiArrowLeftLine className="size-4" />
                </Button>
                <div className="bg-neutral-alpha-100 flex size-8 items-center justify-center rounded-lg">
                  <RiRouteFill className="text-foreground-600 size-4" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-foreground-950 text-base font-semibold">{title}</h1>
                  {workflow.name && workflow.workflowId !== workflow.name && (
                    <p className="text-foreground-400 text-xs">{workflow.workflowId}</p>
                  )}
                </div>
              </div>
            }
          />
          <main className="flex flex-1 flex-col overflow-hidden">
            <StudioWorkflowCanvas steps={workflow.steps} workflowId={workflow.workflowId} />
          </main>
        </div>
      </div>
    </>
  );
}
