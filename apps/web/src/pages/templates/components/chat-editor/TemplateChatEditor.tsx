import { Grid, SegmentedControl, Stack, useMantineTheme } from '@mantine/core';
import { When } from '@novu/design-system';
import { ChannelTypeEnum } from '@novu/shared';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ChatPreview } from '../../../../components/workflow/preview';
import { useEnvironment, useHasActiveIntegrations, useVariablesManager } from '../../../../hooks';
import { useEditTemplateContent } from '../../hooks/useEditTemplateContent';
import { useStepFormPath } from '../../hooks/useStepFormPath';
import { StepSettings } from '../../workflow/SideBar/StepSettings';
import { ControlVariablesForm } from '../ControlVariablesForm';
import { CustomCodeEditor } from '../CustomCodeEditor';

import { EditVariablesModal } from '../EditVariablesModal';
import type { IForm } from '../formTypes';
import { LackIntegrationAlert } from '../LackIntegrationAlert';
import { useTemplateEditorForm } from '../TemplateEditorFormProvider';
import { VariableManagementButton } from '../VariableManagementButton';

const templateFields = ['content'];

export function TemplateChatEditor() {
  const { isPreviewLoading, handleContentChange } = useEditTemplateContent();
  const stepFormPath = useStepFormPath();
  const { control } = useFormContext<IForm>();
  const variablesArray = useVariablesManager(templateFields);
  const { hasActiveIntegration } = useHasActiveIntegrations({
    channelType: ChannelTypeEnum.CHAT,
  });
  const [controlVariables, setControlVariables] = useState();
  const [editVariablesModalOpened, setEditVariablesModalOpen] = useState(false);
  const { template } = useTemplateEditorForm();
  const { bridge } = useEnvironment({ bridge: template?.bridge });

  return (
    <>
      {!hasActiveIntegration ? <LackIntegrationAlert channelType={ChannelTypeEnum.CHAT} /> : null}
      <StepSettings />
      <Grid>
        <Grid.Col span={6}>
          <Controller
            name={`${stepFormPath}.template.content`}
            defaultValue=""
            control={control}
            render={({ field }) => (
              <Stack spacing={8}>
                <VariableManagementButton
                  openEditVariablesModal={() => {
                    setEditVariablesModalOpen(true);
                  }}
                  label={bridge ? 'Control variables' : undefined}
                />
                <When truthy={!bridge}>
                  <CustomCodeEditor
                    value={(field.value as string) || ''}
                    onChange={(value) => {
                      handleContentChange(value, field.onChange);
                    }}
                  />
                </When>
                <When truthy={bridge}>
                  <ControlVariablesForm onChange={setControlVariables} />
                </When>
              </Stack>
            )}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ChatPreview controlVariables={controlVariables} showLoading={isPreviewLoading} />
        </Grid.Col>
      </Grid>
      <EditVariablesModal
        open={editVariablesModalOpened}
        setOpen={setEditVariablesModalOpen}
        variablesArray={variablesArray}
      />
    </>
  );
}
