import { Link, useNavigate, useMatch } from 'react-router-dom';
import { useState, useCallback } from 'react';

import { useWorkflow } from '@/components/workflow-editor/workflow-provider';
import { useEnvironment } from '@/context/environment/hooks';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { useTriggerWorkflow } from '@/hooks/use-trigger-workflow';
import { useWorkflowPayloadPersistence } from '@/hooks/use-workflow-payload-persistence';
import { useAuth } from '@/context/auth/hooks';
import { buildRoute, ROUTES } from '@/utils/routes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs';
import { Button } from '../primitives/button';
import { ButtonGroupItem, ButtonGroupRoot } from '../primitives/button-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../primitives/dropdown-menu';
import { ToastIcon, ToastClose } from '../primitives/sonner';
import { showErrorToast, showToast } from '../primitives/sonner-helpers';
import { WorkflowCanvas } from './workflow-canvas';
import { WorkflowActivity } from './workflow-activity';
import { Protect } from '@/utils/protect';
import { PermissionsEnum, FeatureFlagsKeysEnum } from '@novu/shared';
import { RiPlayCircleLine, RiCodeSSlashLine, RiArrowDownSLine, RiSendPlaneLine } from 'react-icons/ri';
import { TestWorkflowInstructions } from './test-workflow/test-workflow-instructions';

export const WorkflowTabs = () => {
  const { workflow } = useWorkflow();
  const { currentEnvironment } = useEnvironment();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const activityMatch = useMatch(ROUTES.EDIT_WORKFLOW_ACTIVITY);
  const isV2TemplateEditorEnabled = useFeatureFlag(FeatureFlagsKeysEnum.IS_V2_TEMPLATE_EDITOR_ENABLED);
  const [isIntegrateDrawerOpen, setIsIntegrateDrawerOpen] = useState(false);

  const { triggerWorkflow, isPending } = useTriggerWorkflow();
  const { getInitialPayload } = useWorkflowPayloadPersistence({
    workflowId: workflow?.workflowId || '',
    environmentId: currentEnvironment?._id || '',
  });

  const handleIntegrateWorkflowClick = () => {
    setIsIntegrateDrawerOpen(true);
  };

  const handleFireAndForget = useCallback(async () => {
    if (!workflow || !currentUser) {
      showErrorToast('Workflow or user information is missing');
      return;
    }

    try {
      const payload = getInitialPayload(workflow);
      const subscriberData = {
        subscriberId: currentUser._id,
        firstName: currentUser.firstName ?? undefined,
        lastName: currentUser.lastName ?? undefined,
        email: currentUser.email ?? undefined,
      };

      const {
        data: { transactionId },
      } = await triggerWorkflow({
        name: workflow.workflowId ?? '',
        to: subscriberData,
        payload: payload,
      });

      if (!transactionId) {
        return showToast({
          variant: 'lg',
          children: ({ close }) => (
            <>
              <ToastIcon variant="error" />
              <div className="flex flex-col gap-2">
                <span className="font-medium">Test workflow failed</span>
                <span className="text-foreground-600 inline">
                  Workflow <span className="font-bold">{workflow?.name}</span> cannot be triggered. Ensure that it is
                  active and requires no further actions.
                </span>
              </div>
              <ToastClose onClick={close} />
            </>
          ),
          options: {
            position: 'bottom-right',
          },
        });
      }

      showToast({
        children: ({ close }) => (
          <>
            <ToastIcon variant="success" />
            <div className="flex flex-1 flex-col items-start gap-2.5">
              <div className="flex flex-col items-start justify-center gap-1 self-stretch">
                <div className="text-foreground-950 text-sm font-medium">Workflow triggered successfully</div>
                <div className="text-foreground-600 text-sm">Transaction ID: {transactionId}</div>
              </div>
              <div className="flex items-center justify-end gap-2 self-stretch">
                <Button
                  variant="secondary"
                  mode="ghost"
                  size="xs"
                  onClick={() => {
                    const activityUrl =
                      buildRoute(ROUTES.EDIT_WORKFLOW_ACTIVITY, {
                        environmentSlug: currentEnvironment?.slug ?? '',
                        workflowSlug: workflow?.slug ?? '',
                      }) + `?transactionId=${transactionId}`;
                    navigate(activityUrl);
                    close();
                  }}
                >
                  View in Activity
                </Button>
              </div>
            </div>
            <ToastClose className="absolute right-3 top-3" onClick={close} />
          </>
        ),
        options: {
          position: 'bottom-right',
          duration: 6000,
        },
      });
    } catch (e) {
      showErrorToast(
        e instanceof Error ? e.message : 'There was an error triggering the workflow.',
        'Failed to trigger workflow'
      );
    }
  }, [workflow, currentUser, triggerWorkflow, getInitialPayload]);

  // Determine current tab based on URL
  const currentTab = activityMatch ? 'activity' : 'workflow';

  return (
    <div className="flex h-full flex-1 flex-nowrap">
      <Tabs defaultValue="workflow" className="-mt-px flex h-full flex-1 flex-col" value={currentTab}>
        <TabsList variant="regular" className="items-center">
          <TabsTrigger value="workflow" asChild variant="regular" size="lg">
            <Link
              to={buildRoute(ROUTES.EDIT_WORKFLOW, {
                environmentSlug: currentEnvironment?.slug ?? '',
                workflowSlug: workflow?.slug ?? '',
              })}
            >
              Workflow
            </Link>
          </TabsTrigger>
          {isV2TemplateEditorEnabled && (
            <TabsTrigger value="activity" asChild variant="regular" size="lg">
              <Link
                to={buildRoute(ROUTES.EDIT_WORKFLOW_ACTIVITY, {
                  environmentSlug: currentEnvironment?.slug ?? '',
                  workflowSlug: workflow?.slug ?? '',
                })}
              >
                Activity
              </Link>
            </TabsTrigger>
          )}
          {!isV2TemplateEditorEnabled && (
            <Protect permission={PermissionsEnum.EVENT_WRITE}>
              <TabsTrigger value="trigger" asChild variant="regular" size="lg">
                <Link
                  to={buildRoute(ROUTES.TEST_WORKFLOW, {
                    environmentSlug: currentEnvironment?.slug ?? '',
                    workflowSlug: workflow?.slug ?? '',
                  })}
                >
                  Trigger
                </Link>
              </TabsTrigger>
            </Protect>
          )}
          {isV2TemplateEditorEnabled && (
            <div className="my-auto ml-auto flex items-center gap-2">
              <Protect permission={PermissionsEnum.EVENT_WRITE}>
                <Button
                  variant="secondary"
                  size="2xs"
                  mode="ghost"
                  leadingIcon={RiCodeSSlashLine}
                  onClick={handleIntegrateWorkflowClick}
                >
                  Integrate workflow
                </Button>
                <ButtonGroupRoot size="xs">
                  <ButtonGroupItem asChild>
                    <Button
                      variant="secondary"
                      size="xs"
                      mode="gradient"
                      leadingIcon={RiPlayCircleLine}
                      className="rounded-l-lg rounded-r-none border-none p-2 text-white"
                      onClick={() => {
                        navigate(
                          buildRoute(ROUTES.TRIGGER_WORKFLOW, {
                            environmentSlug: currentEnvironment?.slug ?? '',
                            workflowSlug: workflow?.slug ?? '',
                          })
                        );
                      }}
                    >
                      Test workflow
                    </Button>
                  </ButtonGroupItem>
                  <ButtonGroupItem asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="xs"
                          mode="gradient"
                          className="rounded-l-none rounded-r-lg border-none text-white"
                          leadingIcon={RiArrowDownSLine}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleFireAndForget} className="cursor-pointer" disabled={isPending}>
                          <RiSendPlaneLine />
                          Trigger
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ButtonGroupItem>
                </ButtonGroupRoot>
              </Protect>
            </div>
          )}
        </TabsList>
        <TabsContent value="workflow" className="mt-0 h-full w-full">
          <WorkflowCanvas steps={workflow?.steps || []} />
        </TabsContent>
        {isV2TemplateEditorEnabled && (
          <TabsContent value="activity" className="mt-0 h-full w-full">
            <WorkflowActivity />
          </TabsContent>
        )}
      </Tabs>

      {isV2TemplateEditorEnabled && (
        <TestWorkflowInstructions
          isOpen={isIntegrateDrawerOpen}
          onClose={() => setIsIntegrateDrawerOpen(false)}
          workflow={workflow}
          to={{}}
          payload="{}"
        />
      )}
    </div>
  );
};
