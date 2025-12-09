import { GenerateContentResponse } from '@/api/ai';
import { Hint } from '@/components/primitives/hint';
import { ChatPreview } from '@/components/workflow-editor/steps/chat/chat-preview';
import { InboxPreview } from '@/components/workflow-editor/steps/in-app/inbox-preview';
import { EmailCorePreview } from '@/components/workflow-editor/steps/preview/previews/email-preview-wrapper';
import { PushPreview } from '@/components/workflow-editor/steps/push/push-preview';
import { SmsPreview } from '@/components/workflow-editor/steps/sms/sms-preview';
import { ChannelTypeEnum, GeneratePreviewResponseDto, ResourceOriginEnum, StepTypeEnum } from '@novu/shared';
import { useMemo } from 'react';
import { parseVariablesForPreview } from './utils';

type ContentPreviewProps = {
  stepType: StepTypeEnum;
  content?: GenerateContentResponse['content'];
  previewPayload?: Record<string, unknown>;
  suggestedPayload?: Record<string, string>;
};

export function ContentPreview({ stepType, content, previewPayload, suggestedPayload }: ContentPreviewProps) {
  const previewData = useMemo((): GeneratePreviewResponseDto | undefined => {
    if (!content) return undefined;

    const basePayload = { previewPayloadExample: {} };
    const parse = (text: string) => parseVariablesForPreview(text, previewPayload, suggestedPayload);

    switch (stepType) {
      case StepTypeEnum.EMAIL: {
        const emailContent = content as { subject: string; body: string | object; bodyHtml: string };
        const parsedBody = parse(emailContent.bodyHtml || '');

        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.EMAIL,
            preview: {
              subject: parse(emailContent.subject || ''),
              body: parsedBody,
            },
          },
        };
      }

      case StepTypeEnum.SMS: {
        const smsContent = content as { body: string };
        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.SMS,
            preview: {
              body: parse(smsContent.body || ''),
            },
          },
        };
      }

      case StepTypeEnum.PUSH: {
        const pushContent = content as { subject: string; body: string };
        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.PUSH,
            preview: {
              subject: parse(pushContent.subject || ''),
              body: parse(pushContent.body || ''),
            },
          },
        };
      }

      case StepTypeEnum.IN_APP: {
        const inAppContent = content as {
          subject?: string;
          body?: string;
          primaryAction?: { label: string; url?: string };
          secondaryAction?: { label: string; url?: string };
        };

        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.IN_APP,
            preview: {
              subject: parse(inAppContent.subject || ''),
              body: parse(inAppContent.body || ''),
              ...(inAppContent.primaryAction && {
                primaryAction: {
                  label: parse(inAppContent.primaryAction.label),
                  ...(inAppContent.primaryAction.url && {
                    redirect: { url: parse(inAppContent.primaryAction.url) },
                  }),
                },
              }),
              ...(inAppContent.secondaryAction && {
                secondaryAction: {
                  label: parse(inAppContent.secondaryAction.label),
                  ...(inAppContent.secondaryAction.url && {
                    redirect: { url: parse(inAppContent.secondaryAction.url) },
                  }),
                },
              }),
            },
          },
        };
      }

      case StepTypeEnum.CHAT: {
        const chatContent = content as { body: string };
        return {
          ...basePayload,
          result: {
            type: ChannelTypeEnum.CHAT,
            preview: {
              body: parse(chatContent.body || ''),
            },
          },
        };
      }

      default:
        return undefined;
    }
  }, [content, stepType, previewPayload, suggestedPayload]);

  if (!content || !previewData) {
    return null;
  }

  const renderPreview = () => {
    switch (stepType) {
      case StepTypeEnum.EMAIL:
        return (
          <EmailCorePreview
            previewData={previewData}
            isPreviewPending={false}
            isCustomHtmlEditor={true}
            resourceOrigin={ResourceOriginEnum.NOVU_CLOUD}
          />
        );
      case StepTypeEnum.SMS:
        return <SmsPreview previewData={previewData} isPreviewPending={false} />;
      case StepTypeEnum.PUSH:
        return <PushPreview previewData={previewData} isPreviewPending={false} />;
      case StepTypeEnum.IN_APP:
        return <InboxPreview previewData={previewData} isPreviewPending={false} showGradient={false} />;
      case StepTypeEnum.CHAT:
        return <ChatPreview previewData={previewData} isPreviewPending={false} />;
      default:
        return (
          <div className="max-w-md rounded-lg border border-[#e1e4ea] bg-[#fbfbfb] p-4">
            <pre className="whitespace-pre-wrap text-left text-xs text-[#525866]">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-between overflow-hidden p-8">
      <div className="flex w-full flex-1 items-center justify-center overflow-auto">
        <div className="h-full w-full max-w-4xl">{renderPreview()}</div>
      </div>
      <div className="flex shrink-0 flex-col items-center pt-4">
        <Hint className="text-center">You can always edit your content once inserted into the step editor</Hint>
      </div>
    </div>
  );
}
