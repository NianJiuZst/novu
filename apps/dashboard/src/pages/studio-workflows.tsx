import { RiSignalWifiErrorLine } from 'react-icons/ri';
import { HeaderNavigation } from '@/components/header-navigation/header-navigation';
import { PageMeta } from '@/components/page-meta';
import { Skeleton } from '@/components/primitives/skeleton';
import { SideNavigation } from '@/components/side-navigation/side-navigation';
import { StudioWorkflowCard } from '@/components/studio/studio-workflow-card';
import { useBridgeConnectionStatus, useDiscover } from '@/hooks/use-bridge-api';

export function StudioWorkflowsPage() {
  const { data, isPending } = useDiscover();
  const { status } = useBridgeConnectionStatus();

  const workflows = data?.workflows || [];
  const hasWorkflows = workflows.length > 0;

  if (status === 'disconnected') {
    return (
      <>
        <PageMeta title="Studio - Disconnected" />
        <div className="flex h-screen w-full">
          <SideNavigation />
          <div className="flex flex-1 flex-col">
            <HeaderNavigation />
            <main className="flex flex-1 items-center justify-center p-6">
              <div className="flex max-w-md flex-col items-center gap-4 text-center">
                <div className="bg-warning/10 text-warning flex size-12 items-center justify-center rounded-full">
                  <RiSignalWifiErrorLine className="size-6" />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-foreground-950 text-xl font-semibold">Studio Disconnected</h2>
                  <p className="text-foreground-600 text-sm">
                    Local environment disconnected from Novu Bridge URL. This usually happens when your Bridge app is
                    not running or <code className="bg-neutral-alpha-100 rounded px-1 py-0.5">npx novu dev</code> is not
                    running.
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Studio" />
      <div className="flex h-screen w-full">
        <SideNavigation />
        <div className="flex flex-1 flex-col">
          <HeaderNavigation />
          <main className="flex flex-1 flex-col overflow-auto p-6">
            {isPending ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : hasWorkflows ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                  <StudioWorkflowCard key={workflow.workflowId} workflow={workflow} />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex max-w-md flex-col items-center gap-4 text-center">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-foreground-950 text-xl font-semibold">No Workflows Available</h2>
                    <p className="text-foreground-600 text-sm">
                      A workflow holds the entire flow of steps that are sent to the subscriber. Get started by adding
                      your first workflow in your local environment.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
