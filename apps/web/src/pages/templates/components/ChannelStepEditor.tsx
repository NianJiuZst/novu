import { isBridgeWorkflow, ResourceTypeEnum, StepTypeEnum } from '@novu/shared';
import { useParams } from 'react-router-dom';
import { useNavigateFromEditor } from '../hooks/useNavigateFromEditor';
import { useStepIndex } from '../hooks/useStepIndex';
import { DelayMetadata } from '../workflow/DelayMetadata';
import { DigestMetadata } from '../workflow/DigestMetadata';
import { TemplateChatEditor } from './chat-editor/TemplateChatEditor';
import { TemplateCustomEditor } from './custom-editor/TemplateCustomEditor';
import { EmailMessagesCards } from './email-editor/EmailMessagesCards';
import { TemplateInAppEditor } from './in-app-editor/TemplateInAppEditor';
import { StepEditorSidebar } from './StepEditorSidebar';
import { TemplateSMSEditor } from './sms-editor/TemplateSMSEditor';
import { useTemplateEditorForm } from './TemplateEditorFormProvider';
import { TemplatePushEditor } from './TemplatePushEditor';

export const ChannelStepEditor = () => {
  const { channel } = useParams<{
    channel: StepTypeEnum | undefined;
  }>();
  const { stepIndex, step } = useStepIndex();
  const { template } = useTemplateEditorForm();

  useNavigateFromEditor();

  if (stepIndex === -1 || channel === undefined) {
    return null;
  }

  if (channel === StepTypeEnum.IN_APP) {
    return (
      <StepEditorSidebar>
        <TemplateInAppEditor />
      </StepEditorSidebar>
    );
  }

  if (channel === StepTypeEnum.EMAIL) {
    return (
      <StepEditorSidebar>
        <EmailMessagesCards />
      </StepEditorSidebar>
    );
  }

  if (channel === StepTypeEnum.CUSTOM) {
    return (
      <StepEditorSidebar>
        <TemplateCustomEditor />
      </StepEditorSidebar>
    );
  }

  if (isBridgeWorkflow(template?.type) && (channel === StepTypeEnum.DIGEST || channel === StepTypeEnum.DELAY)) {
    return (
      <StepEditorSidebar>
        <TemplateCustomEditor />
      </StepEditorSidebar>
    );
  }

  return (
    <>
      <StepEditorSidebar>
        {channel === StepTypeEnum.SMS && <TemplateSMSEditor />}
        {channel === StepTypeEnum.PUSH && <TemplatePushEditor />}
        {channel === StepTypeEnum.CHAT && <TemplateChatEditor />}
        {channel === StepTypeEnum.DIGEST && <DigestMetadata />}
        {channel === StepTypeEnum.DELAY && <DelayMetadata />}
      </StepEditorSidebar>
    </>
  );
};
