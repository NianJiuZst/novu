import { Group } from '@mantine/core';
import { StepTypeEnum } from '@novu/shared';
import { useParams } from 'react-router-dom';
import { When } from '../../../../components/utils/When';
import { useEnvironment } from '../../../../hooks';
import { useTemplateEditorForm } from '../../components/TemplateEditorFormProvider';
import { UpdateButton } from '../../components/UpdateButton';
import { ReplyCallback, ReplyCallbackSwitch } from '../ReplyCallback';
import { ShouldStopOnFailSwitch } from '../ShouldStopOnFailSwitch';
import { StepActiveSwitch } from '../StepActiveSwitch';

export function StepSettings() {
  const { channel: channelType } = useParams<{
    channel: StepTypeEnum;
  }>();
  const { template } = useTemplateEditorForm();
  const { bridge } = useEnvironment({ bridge: template?.bridge });

  return (
    <>
      <Group position="apart" spacing={8}>
        <Group spacing={12}>
          <When truthy={!bridge}>
            <When truthy={channelType !== StepTypeEnum.DIGEST && channelType !== StepTypeEnum.DELAY}>
              <StepActiveSwitch />
              <ShouldStopOnFailSwitch />
              <When truthy={channelType === StepTypeEnum.EMAIL}>
                <ReplyCallbackSwitch />
              </When>
            </When>
          </When>
        </Group>
        <UpdateButton />
      </Group>
      <When truthy={!bridge}>
        <ReplyCallback />
      </When>
    </>
  );
}
