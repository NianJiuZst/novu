import { Skeleton } from '@/components/primitives/skeleton';
import { ChatPreview } from '@/components/workflow-editor/steps/chat/chat-preview';
import { InboxPreview } from '@/components/workflow-editor/steps/in-app/inbox-preview';
import { PushPreview } from '@/components/workflow-editor/steps/push/push-preview';
import { SmsPreview } from '@/components/workflow-editor/steps/sms/sms-preview';
import { StepTypeEnum } from '@novu/shared';
import { RiMailCloseLine } from 'react-icons/ri';
import { getChannelLabel } from './utils';

type LoadingStateProps = {
  stepType: StepTypeEnum;
};

export function LoadingState({ stepType }: LoadingStateProps) {
  const channelLabel = getChannelLabel(stepType);

  if (stepType === StepTypeEnum.EMAIL) {
    return <EmailLoadingPreview />;
  }

  const renderLoadingPreview = () => {
    switch (stepType) {
      case StepTypeEnum.SMS:
        return <SmsPreview previewData={undefined} isPreviewPending={true} />;
      case StepTypeEnum.PUSH:
        return <PushPreview previewData={undefined} isPreviewPending={true} />;
      case StepTypeEnum.IN_APP:
        return <InboxPreview previewData={undefined} isPreviewPending={true} showGradient={false} />;
      case StepTypeEnum.CHAT:
        return <ChatPreview previewData={undefined} isPreviewPending={true} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center overflow-hidden px-16 pb-8 pt-16">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="w-full">{renderLoadingPreview()}</div>

        <div className="relative inline-flex">
          <span className="text-xs font-medium text-text-soft">Generating {channelLabel}...</span>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailLoadingPreview() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-8">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <div className="overflow-hidden rounded-lg border border-stroke-weak bg-white shadow-xs">
          <div className="flex flex-col gap-2 border-b border-stroke-weak p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-text-strong">Acme Inc.</span>
                    <span className="text-xs text-text-sub">&lt;noreply@novu.co&gt;</span>
                  </div>
                </div>
                <span className="text-xs text-text-sub">to me</span>
              </div>
            </div>
          </div>

          <div className="border-b border-stroke-weak px-3 py-2">
            <span className="text-base font-medium text-text-soft">Subject</span>
          </div>

          <div className="flex min-h-[406px] flex-col items-center justify-center bg-bg-weak p-8">
            <div className="flex w-full max-w-[412px] flex-col items-center gap-8">
              <div className="flex h-[46px] w-[136px] items-start rounded-lg border border-dashed border-stroke-soft p-1">
                <div className="flex flex-1 items-center justify-center rounded-md border border-stroke-soft bg-white p-3">
                  <RiMailCloseLine className="size-4 text-text-disabled" />
                </div>
              </div>

              <div className="flex flex-col rounded-lg border border-stroke-soft p-1">
                <div className="w-[197px] overflow-hidden rounded-md border border-stroke-soft bg-white">
                  <div className="flex items-center gap-1 border-b border-stroke-soft p-2">
                    <Skeleton className="size-4 rounded-full" />
                    <div className="flex flex-col gap-0.5">
                      <Skeleton className="h-[5px] w-[44px] rounded-full" />
                      <Skeleton className="h-[5px] w-[77px] rounded-full" />
                    </div>
                  </div>

                  <div className="bg-bg-weak p-4">
                    <div className="flex flex-col gap-2.5 rounded-md bg-white p-2">
                      <div className="flex flex-col gap-0.5">
                        <Skeleton className="size-3 rounded" />
                        <Skeleton className="h-1 w-[77px] rounded" />
                      </div>
                      <div className="flex flex-wrap gap-0.5">
                        <Skeleton className="h-1 w-[63px] rounded" />
                        <Skeleton className="h-1 w-[31px] rounded" />
                        <Skeleton className="h-1 flex-1 rounded" />
                        <Skeleton className="h-1 w-[45px] rounded" />
                        <Skeleton className="h-1 w-[34px] rounded" />
                      </div>
                      <Skeleton className="h-1 w-[25px] rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative inline-flex justify-center">
          <span className="text-xs font-medium text-text-soft">Generating email...</span>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
