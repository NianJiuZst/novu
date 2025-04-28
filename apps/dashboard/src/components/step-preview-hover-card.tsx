import {
  ChannelTypeEnum,
  ChatRenderOutput,
  GeneratePreviewResponseDto,
  InAppRenderOutput,
  PushRenderOutput,
} from '@novu/shared';
import { ChatPreview } from './workflow-editor/steps/chat/chat-preview';
import { EmailPreviewHeader, EmailPreviewSubject } from './workflow-editor/steps/email/email-preview';
import { Maily } from './workflow-editor/steps/email/maily';
import { InboxPreview } from './workflow-editor/steps/in-app/inbox-preview';
import { PushPreview } from './workflow-editor/steps/push/push-preview';
import { SmsPhone } from './workflow-editor/steps/sms/sms-phone';
import { StepTypeEnum } from '@novu/api/models/components/steptypeenum';

;

export type StepType = StepTypeEnum;

interface StepPreviewProps {
  type: StepType;
  controlValues?: any;
}

export function StepPreview({ type, controlValues }: StepPreviewProps) {
  if (type === StepTypeEnum.Trigger || type === StepTypeEnum.Delay || type === StepTypeEnum.Digest) {
    return null;
  }

  if (type === StepTypeEnum.InApp) {
    const { subject, body } = controlValues;

    return (
      <InboxPreview
        isPreviewPending={false}
        previewData={{
          result: {
            type: ChannelTypeEnum.IN_APP as const,
            preview: {
              subject,
              body,
            } as InAppRenderOutput,
          },
          previewPayloadExample: {},
        }}
      />
    );
  }

  if (type === StepTypeEnum.Email) {
    const { subject, body } = controlValues;

    return (
      <div className="bg-background p-3">
        <EmailPreviewHeader />
        <EmailPreviewSubject className="px-3 py-2" subject={subject} />
        <div className="mx-auto w-full overflow-auto">
          <Maily value={body} />
        </div>
      </div>
    );
  }

  if (type === StepTypeEnum.Sms) {
    const { body } = controlValues;

    return (
      <div className="p-4">
        <SmsPhone smsBody={body} />
      </div>
    );
  }

  if (type === StepTypeEnum.Chat) {
    const { body } = controlValues;
    const previewData: GeneratePreviewResponseDto = {
      result: {
        type: ChannelTypeEnum.CHAT as const,
        preview: {
          body,
          content: body,
        } as ChatRenderOutput,
      },
      previewPayloadExample: {},
    };

    return (
      <div className="p-4">
        <ChatPreview isPreviewPending={false} previewData={previewData} />
      </div>
    );
  }

  if (type === StepTypeEnum.Push) {
    const { subject, body } = controlValues;
    const previewData: GeneratePreviewResponseDto = {
      result: {
        type: ChannelTypeEnum.PUSH as const,
        preview: {
          subject,
          body,
          title: subject,
          content: body,
        } as PushRenderOutput,
      },
      previewPayloadExample: {},
    };

    return (
      <div className="p-4">
        <PushPreview isPreviewPending={false} previewData={previewData} />
      </div>
    );
  }
}
