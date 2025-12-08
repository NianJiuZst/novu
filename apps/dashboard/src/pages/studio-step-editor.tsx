import { useCallback, useEffect, useState } from 'react';
import { RiArrowLeftLine } from 'react-icons/ri';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HeaderNavigation } from '@/components/header-navigation/header-navigation';
import { STEP_TYPE_TO_ICON } from '@/components/icons/utils';
import { PageMeta } from '@/components/page-meta';
import { Button } from '@/components/primitives/button';
import { Skeleton } from '@/components/primitives/skeleton';
import { SideNavigation } from '@/components/side-navigation/side-navigation';
import { StudioStepEditorLayout } from '@/components/studio/studio-step-editor-layout';
import { useWorkflow } from '@/hooks/use-bridge-api';
import { useStudioStepPreview } from '@/hooks/use-studio-step-preview';
import { StepTypeEnum } from '@/utils/enums';
import { buildRoute, ROUTES } from '@/utils/routes';

const stepTypeMap: Record<string, StepTypeEnum> = {
  email: StepTypeEnum.EMAIL,
  in_app: StepTypeEnum.IN_APP,
  sms: StepTypeEnum.SMS,
  chat: StepTypeEnum.CHAT,
  push: StepTypeEnum.PUSH,
  digest: StepTypeEnum.DIGEST,
  delay: StepTypeEnum.DELAY,
  throttle: StepTypeEnum.THROTTLE,
  custom: StepTypeEnum.CUSTOM,
};

export function StudioStepEditorPage() {
  const { workflowId, stepId } = useParams<{ workflowId: string; stepId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: workflow, isPending: isWorkflowPending } = useWorkflow(workflowId || '');

  const step = workflow?.steps.find((s) => s.stepId === stepId);

  const [controls, setControls] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (step?.controls?.schema?.properties) {
      const defaultControls: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(step.controls.schema.properties)) {
        const schemaValue = value as { default?: unknown };
        if (schemaValue.default !== undefined) {
          defaultControls[key] = schemaValue.default;
        }
      }
      setControls(defaultControls);
    }
  }, [step]);

  const {
    data: preview,
    isPending: isPreviewPending,
    isError: isPreviewError,
  } = useStudioStepPreview({
    workflowId: workflowId || '',
    stepId: stepId || '',
    controls,
    enabled: !!workflow && !!step,
  });

  const handleControlsChange = useCallback((newControls: Record<string, unknown>) => {
    setControls(newControls);
  }, []);

  const handleBack = () => {
    const searchParams = new URLSearchParams(location.search);
    navigate({
      pathname: buildRoute(ROUTES.STUDIO_WORKFLOW, { workflowId: workflowId || '' }),
      search: searchParams.toString(),
    });
  };

  if (isWorkflowPending) {
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

  if (!workflow || !step) {
    return (
      <>
        <PageMeta title="Step Not Found" />
        <div className="flex h-screen w-full">
          <SideNavigation />
          <div className="flex flex-1 flex-col">
            <HeaderNavigation />
            <main className="flex flex-1 items-center justify-center p-6">
              <div className="flex max-w-md flex-col items-center gap-4 text-center">
                <div className="flex flex-col gap-2">
                  <h2 className="text-foreground-950 text-xl font-semibold">Step Not Found</h2>
                  <p className="text-foreground-600 text-sm">
                    The step you're looking for doesn't exist or has been removed.
                  </p>
                </div>
                <Button onClick={handleBack}>Back to Workflow</Button>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  const stepType = stepTypeMap[step.type] || StepTypeEnum.CUSTOM;
  const Icon = STEP_TYPE_TO_ICON[stepType];

  return (
    <>
      <PageMeta title={`Edit ${step.stepId}`} />
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
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-foreground-950 text-base font-semibold">{step.stepId}</h1>
                  <p className="text-foreground-400 text-xs capitalize">{step.type.replace('_', ' ')}</p>
                </div>
              </div>
            }
          />
          <main className="flex flex-1 flex-col overflow-hidden">
            <StudioStepEditorLayout
              step={step}
              controls={controls}
              onControlsChange={handleControlsChange}
              preview={preview}
              isPreviewPending={isPreviewPending}
              isPreviewError={isPreviewError}
            />
          </main>
        </div>
      </div>
    </>
  );
}
