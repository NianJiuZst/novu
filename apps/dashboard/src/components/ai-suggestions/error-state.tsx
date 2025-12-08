import { ChatPreview } from '@/components/workflow-editor/steps/chat/chat-preview';
import { InboxPreview } from '@/components/workflow-editor/steps/in-app/inbox-preview';
import { PushPreview } from '@/components/workflow-editor/steps/push/push-preview';
import { SmsPreview } from '@/components/workflow-editor/steps/sms/sms-preview';
import { StepTypeEnum } from '@novu/shared';
import { RiArrowLeftSLine } from 'react-icons/ri';
import { RxCrossCircled } from 'react-icons/rx';

type ErrorStateProps = {
  stepType: StepTypeEnum;
  onBackToPrompt: () => void;
};

export function ErrorState({ stepType, onBackToPrompt }: ErrorStateProps) {
  if (stepType === StepTypeEnum.EMAIL) {
    return <EmailErrorPreview onBackToPrompt={onBackToPrompt} />;
  }

  const renderLoadingPreview = () => {
    switch (stepType) {
      case StepTypeEnum.SMS:
        return <SmsPreview previewData={undefined} isPreviewPending={true} />;
      case StepTypeEnum.PUSH:
        return <PushPreview previewData={undefined} isPreviewPending={true} />;
      case StepTypeEnum.IN_APP:
        return <InboxPreview previewData={undefined} isPreviewPending={true} />;
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
          <button
            type="button"
            onClick={onBackToPrompt}
            className="flex items-center gap-0.5 overflow-hidden rounded-lg bg-white p-1.5 shadow-[0px_1px_3px_0px_rgba(14,18,27,0.12),0px_0px_0px_1px_#e1e4ea] transition-colors hover:bg-neutral-50"
          >
            <RiArrowLeftSLine className="size-4" />
            <div className="flex items-center justify-center px-1 py-0">
              <span className="text-xs font-medium leading-4 text-[#525866]">Back to prompt</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailErrorPreview({ onBackToPrompt }: { onBackToPrompt: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-8">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <div className="overflow-hidden rounded-lg border border-[#f2f5f8] bg-white shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]">
          <div className="flex flex-col gap-2 border-b border-[#f2f5f8] p-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-[#e1e4ea]" />
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-[#0e121b]">Acme Inc.</span>
                    <span className="text-xs text-[#525866]">&lt;noreply@novu.co&gt;</span>
                  </div>
                </div>
                <span className="text-xs text-[#525866]">to me</span>
              </div>
            </div>
          </div>

          <div className="border-b border-[#f2f5f8] px-3 py-2">
            <span className="text-base font-medium text-[#99a0ae]">Subject</span>
          </div>

          <div className="flex min-h-[406px] flex-col items-center justify-center bg-[#fbfbfb] p-8">
            <div className="flex w-full max-w-[412px] flex-col items-center gap-8">
              <div className="flex h-[46px] w-[136px] items-start rounded-lg border border-dashed border-[#e1e4ea] p-1">
                <div className="flex flex-1 items-center justify-center rounded-md border border-[#e1e4ea] bg-white p-3">
                  <RxCrossCircled className="size-3 text-[#fb3748]" />
                </div>
              </div>

              <div className="flex flex-col rounded-lg border border-[#e1e4ea] p-1">
                <div className="w-[197px] overflow-hidden rounded-md border border-[#e1e4ea] bg-white">
                  <div className="flex items-center gap-1 border-b border-[#e1e4ea] p-2">
                    <div className="relative size-4 overflow-hidden rounded-full bg-[#f4f5f6]">
                      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="relative h-[5px] w-[44px] overflow-hidden rounded-full bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                      </div>
                      <div className="relative h-[5px] w-[77px] overflow-hidden rounded-full bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fbfbfb] p-4">
                    <div className="flex flex-col gap-2.5 rounded-md bg-white p-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="relative size-3 overflow-hidden rounded bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>
                        <div className="relative h-1 w-[77px] overflow-hidden rounded bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-0.5">
                        <div className="relative h-1 w-[63px] overflow-hidden rounded bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>
                        <div className="relative h-1 w-[31px] overflow-hidden rounded bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>
                        <div className="relative h-1 flex-1 overflow-hidden rounded bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>
                        <div className="relative h-1 w-[45px] overflow-hidden rounded bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>
                        <div className="relative h-1 w-[34px] overflow-hidden rounded bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>
                      </div>
                      <div className="relative h-1 w-[25px] overflow-hidden rounded bg-gradient-to-r from-[#f1efef] via-[#f9f8f8] to-[rgba(249,248,248,0.75)]">
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-xs font-medium leading-4 text-[#fb3748]">Well… that didn't work.</p>
          <button
            type="button"
            onClick={onBackToPrompt}
            className="flex items-center gap-0.5 overflow-hidden rounded-lg bg-white p-1.5 shadow-[0px_1px_3px_0px_rgba(14,18,27,0.12),0px_0px_0px_1px_#e1e4ea] transition-colors hover:bg-neutral-50"
          >
            <RiArrowLeftSLine className="size-4" />
            <div className="flex items-center justify-center px-1 py-0">
              <span className="text-xs font-medium leading-4 text-[#525866]">Back to prompt</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

