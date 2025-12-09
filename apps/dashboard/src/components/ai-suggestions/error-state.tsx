import { Button } from '@/components/primitives/button';
import { ChatPreview } from '@/components/workflow-editor/steps/chat/chat-preview';
import { InboxPreview } from '@/components/workflow-editor/steps/in-app/inbox-preview';
import { PushPreview } from '@/components/workflow-editor/steps/push/push-preview';
import { SmsPreview } from '@/components/workflow-editor/steps/sms/sms-preview';
import { StepTypeEnum } from '@novu/shared';
import { RiArrowLeftSLine } from 'react-icons/ri';
import { EmailStatePreview } from './email-state-preview';

type ErrorStateProps = {
  stepType: StepTypeEnum;
  onBackToPrompt: () => void;
};

export function ErrorState({ stepType, onBackToPrompt }: ErrorStateProps) {
  if (stepType === StepTypeEnum.EMAIL) {
    return <EmailStatePreview variant="error" message="Well… that didn't work." onBackToPrompt={onBackToPrompt} />;
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
    <div className="flex flex-1 flex-col items-center justify-between overflow-hidden px-16 pb-8 pt-16">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="w-full">{renderLoadingPreview()}</div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-xs font-medium leading-4 text-[#fb3748]">Well… that didn't work.</p>
          <Button
            variant="secondary"
            className="h-[26px]"
            mode="outline"
            size="2xs"
            leadingIcon={RiArrowLeftSLine}
            onClick={onBackToPrompt}
          >
            Back to prompt
          </Button>
        </div>
      </div>
    </div>
  );
}
