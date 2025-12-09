import { ChatPreview } from '@/components/workflow-editor/steps/chat/chat-preview';
import { InboxPreview } from '@/components/workflow-editor/steps/in-app/inbox-preview';
import { PushPreview } from '@/components/workflow-editor/steps/push/push-preview';
import { SmsPreview } from '@/components/workflow-editor/steps/sms/sms-preview';
import { StepTypeEnum } from '@novu/shared';
import { EmailStatePreview } from './email-state-preview';
import { getChannelLabel } from './utils';

type LoadingStateProps = {
  stepType: StepTypeEnum;
};

export function LoadingState({ stepType }: LoadingStateProps) {
  const channelLabel = getChannelLabel(stepType);

  if (stepType === StepTypeEnum.EMAIL) {
    return <EmailStatePreview variant="loading" message="Generating email..." />;
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
