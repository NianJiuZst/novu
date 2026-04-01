import { ChannelTypeEnum } from '@novu/shared';
import * as Sentry from '@sentry/react';
import { HTMLAttributes, ReactNode, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  InAppPreviewActions,
  InAppPreview,
  InAppPreviewAvatar,
  InAppPreviewBell,
  InAppPreviewBody,
  InAppPreviewHeader,
  InAppPreviewNotification,
  InAppPreviewNotificationContent,
  InAppPreviewPrimaryAction,
  InAppPreviewSecondaryAction,
  InAppPreviewSubject,
} from '@/components/workflow-editor/in-app-preview';
import { useWorkflow } from '@/components/workflow-editor/workflow-provider';
import { usePreviewStep } from '@/hooks/use-preview-step';

type ConfigureInAppStepPreviewProps = HTMLAttributes<HTMLDivElement>;

export const ConfigureInAppStepPreview = (props: ConfigureInAppStepPreviewProps) => {
  const {
    previewStep,
    data: previewData,
    isPending: isPreviewPending,
  } = usePreviewStep({
    onError: (error) => {
      Sentry.captureException(error);
    },
  });
  const { step, isPending } = useWorkflow();

  const { workflowSlug, stepSlug } = useParams<{
    workflowSlug: string;
    stepSlug: string;
  }>();

  useEffect(() => {
    if (!workflowSlug || !stepSlug || !step || isPending) return;

    previewStep({
      workflowSlug,
      stepSlug,
      previewData: { controlValues: step.controls.values, previewPayload: {} },
    });
  }, [workflowSlug, stepSlug, previewStep, step, isPending]);

  const previewResult = previewData?.result;
  let notificationContent: ReactNode = null;

  if (isPreviewPending || previewData === undefined) {
    notificationContent = (
      <InAppPreviewNotification>
        <InAppPreviewAvatar isPending />
        <InAppPreviewNotificationContent>
          <InAppPreviewSubject isPending />
          <InAppPreviewBody isPending className="line-clamp-2" />
          <InAppPreviewActions>
            <InAppPreviewPrimaryAction isPending />
            <InAppPreviewSecondaryAction isPending />
          </InAppPreviewActions>
        </InAppPreviewNotificationContent>
      </InAppPreviewNotification>
    );
  } else if (previewResult?.type === undefined || previewResult?.type !== ChannelTypeEnum.IN_APP) {
    notificationContent = (
      <InAppPreviewNotification className="flex-1 items-center">
        <InAppPreviewNotificationContent className="my-auto">
          <InAppPreviewBody className="mb-4 text-center">No preview available</InAppPreviewBody>
        </InAppPreviewNotificationContent>
      </InAppPreviewNotification>
    );
  } else {
    notificationContent = (
      <InAppPreviewNotification>
        <InAppPreviewAvatar src={previewResult.preview?.avatar} />
        <InAppPreviewNotificationContent>
          <InAppPreviewSubject>{previewResult.preview?.subject}</InAppPreviewSubject>
          <InAppPreviewBody className="line-clamp-3">{previewResult.preview?.body}</InAppPreviewBody>
          <InAppPreviewActions>
            <InAppPreviewPrimaryAction>{previewResult.preview?.primaryAction?.label}</InAppPreviewPrimaryAction>
            <InAppPreviewSecondaryAction>{previewResult.preview?.secondaryAction?.label}</InAppPreviewSecondaryAction>
          </InAppPreviewActions>
        </InAppPreviewNotificationContent>
      </InAppPreviewNotification>
    );
  }

  return (
    <div {...props}>
      <div className="relative mx-auto max-w-sm py-1">
        <InAppPreviewBell className="px-0 pb-1 pt-0" />
        <InAppPreview className="min-h-52 bg-bg-white">
          <InAppPreviewHeader />
          {notificationContent}
        </InAppPreview>
      </div>
    </div>
  );
};
