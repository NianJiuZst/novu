import type { ExecuteOutput } from '@novu/framework/internal';
import { ChannelTypeEnum, StepTypeEnum } from '@novu/shared';
import { Skeleton } from '@/components/primitives/skeleton';
import {
  InAppPreview,
  InAppPreviewAvatar,
  InAppPreviewBody,
  InAppPreviewHeader,
  InAppPreviewNotification,
  InAppPreviewNotificationContent,
  InAppPreviewSubject,
} from '@/components/workflow-editor/in-app-preview';

type StudioStepPreviewProps = {
  stepType: string;
  preview?: ExecuteOutput;
  isPending: boolean;
  isError: boolean;
};

export function StudioStepPreview({ stepType, preview, isPending, isError }: StudioStepPreviewProps) {
  if (isPending) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <span className="text-foreground-600 text-sm">Unable to load preview</span>
      </div>
    );
  }

  const normalizedStepType = stepType.toLowerCase();

  switch (normalizedStepType) {
    case StepTypeEnum.IN_APP:
    case 'in_app': {
      const inAppPreview = preview.outputs as { avatar?: string; subject?: string; body?: string };

      return (
        <InAppPreview className="p-4">
          <InAppPreviewHeader />
          <InAppPreviewNotification>
            <InAppPreviewAvatar src={inAppPreview.avatar} />
            <InAppPreviewNotificationContent>
              <InAppPreviewSubject>{inAppPreview.subject}</InAppPreviewSubject>
              <InAppPreviewBody className="line-clamp-2">{inAppPreview.body}</InAppPreviewBody>
            </InAppPreviewNotificationContent>
          </InAppPreviewNotification>
        </InAppPreview>
      );
    }

    case StepTypeEnum.EMAIL:
    case 'email': {
      const emailOutputs = preview.outputs as { subject?: string; body?: string };

      return (
        <div className="flex h-full w-full flex-col gap-4 overflow-auto p-4">
          {emailOutputs?.subject && (
            <div className="flex flex-col gap-1">
              <span className="text-foreground-600 text-xs font-medium">Subject</span>
              <span className="text-foreground-950 text-sm">{emailOutputs.subject}</span>
            </div>
          )}
          {emailOutputs?.body && (
            <div className="flex flex-col gap-1">
              <span className="text-foreground-600 text-xs font-medium">Body</span>
              <div className="bg-neutral-alpha-50 text-foreground-950 max-h-96 overflow-auto rounded-lg border p-3 text-sm">
                {emailOutputs.body}
              </div>
            </div>
          )}
        </div>
      );
    }

    case StepTypeEnum.SMS:
    case 'sms': {
      const smsOutputs = preview.outputs as { body?: string };

      return (
        <div className="flex h-full w-full items-center justify-center p-4">
          <div className="bg-neutral-alpha-50 w-full max-w-md rounded-lg border p-4">
            <div className="flex flex-col gap-2">
              <span className="text-foreground-600 text-xs font-medium">SMS Content</span>
              <span className="text-foreground-950 text-sm">{smsOutputs?.body || 'No content'}</span>
            </div>
          </div>
        </div>
      );
    }

    case StepTypeEnum.PUSH:
    case 'push': {
      const pushOutputs = preview.outputs as { subject?: string; body?: string };

      return (
        <div className="flex h-full w-full items-center justify-center p-4">
          <div className="bg-neutral-alpha-50 w-full max-w-md rounded-lg border p-4">
            <div className="flex flex-col gap-3">
              {pushOutputs?.subject && (
                <div className="flex flex-col gap-1">
                  <span className="text-foreground-600 text-xs font-medium">Title</span>
                  <span className="text-foreground-950 text-sm font-medium">{pushOutputs.subject}</span>
                </div>
              )}
              {pushOutputs?.body && (
                <div className="flex flex-col gap-1">
                  <span className="text-foreground-600 text-xs font-medium">Body</span>
                  <span className="text-foreground-950 text-sm">{pushOutputs.body}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    case StepTypeEnum.CHAT:
    case 'chat': {
      const chatOutputs = preview.outputs as { body?: string };

      return (
        <div className="flex h-full w-full items-center justify-center p-4">
          <div className="bg-neutral-alpha-50 w-full max-w-md rounded-lg border p-4">
            <div className="flex flex-col gap-2">
              <span className="text-foreground-600 text-xs font-medium">Chat Message</span>
              <span className="text-foreground-950 text-sm">{chatOutputs?.body || 'No content'}</span>
            </div>
          </div>
        </div>
      );
    }

    case StepTypeEnum.DIGEST:
    case 'digest':
    case StepTypeEnum.DELAY:
    case 'delay':
    case StepTypeEnum.THROTTLE:
    case 'throttle':
    case StepTypeEnum.CUSTOM:
    case 'custom': {
      return (
        <div className="flex h-full w-full flex-col gap-2 overflow-auto p-4">
          <span className="text-foreground-600 text-xs font-medium">Output</span>
          <pre className="bg-neutral-alpha-50 text-foreground-950 rounded-lg border p-3 text-xs">
            {JSON.stringify(preview.outputs, null, 2)}
          </pre>
        </div>
      );
    }

    default:
      return <NoPreview />;
  }
}

function NoPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <span className="text-foreground-600 text-sm">No preview available</span>
    </div>
  );
}
