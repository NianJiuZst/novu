import { Flex, Grid, Stack, useMantineTheme } from '@mantine/core';
import { colors, Text, When } from '@novu/design-system';
import { ChannelTypeEnum } from '@novu/shared';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { PushPreview } from '../../../components/workflow/preview';
import { useEnvironment, useHasActiveIntegrations, useVariablesManager } from '../../../hooks';
import { useEditTemplateContent } from '../hooks/useEditTemplateContent';
import { useStepFormPath } from '../hooks/useStepFormPath';
import { StepSettings } from '../workflow/SideBar/StepSettings';
import { ControlVariablesForm } from './ControlVariablesForm';
import { CustomCodeEditor } from './CustomCodeEditor';
import { EditVariablesModal } from './EditVariablesModal';
import { LackIntegrationAlert } from './LackIntegrationAlert';
import { useTemplateEditorForm } from './TemplateEditorFormProvider';
import { VariableManagementButton } from './VariableManagementButton';

const templateFields = ['content', 'title'];

export function TemplatePushEditor() {
  const [editVariablesModalOpened, setEditVariablesModalOpen] = useState(false);
  const stepFormPath = useStepFormPath();
  const { control } = useFormContext();
  const variablesArray = useVariablesManager(templateFields);
  const [controlVariables, setControlVariables] = useState();

  const { isPreviewLoading, handleContentChange } = useEditTemplateContent();
  const { hasActiveIntegration } = useHasActiveIntegrations({
    channelType: ChannelTypeEnum.PUSH,
  });
  const { template } = useTemplateEditorForm();
  const { bridge } = useEnvironment({ bridge: template?.bridge });

  return (
    <>
      {!hasActiveIntegration ? <LackIntegrationAlert channelType={ChannelTypeEnum.PUSH} /> : null}
      <StepSettings />

      <Grid gutter={24}>
        <Grid.Col span={'auto'}>
          <Stack spacing={32}>
            <Controller
              name={`${stepFormPath}.template.title` as any}
              defaultValue=""
              control={control}
              render={({ field }) => (
                <Stack spacing={8} data-test-id="push-title-container">
                  <When truthy={!bridge}>
                    <VariableManagementButton
                      openEditVariablesModal={() => {
                        setEditVariablesModalOpen(true);
                      }}
                      label={bridge ? 'Control variables' : 'Title'}
                    />

                    <CustomCodeEditor
                      value={(field.value as string) || ''}
                      onChange={(value) => {
                        handleContentChange(value, field.onChange);
                      }}
                      height="128px"
                    />
                  </When>
                  <When truthy={bridge}>
                    <ControlVariablesForm onChange={setControlVariables} />
                  </When>
                </Stack>
              )}
            />
            <When truthy={!bridge}>
              <Controller
                name={`${stepFormPath}.template.content` as any}
                defaultValue=""
                control={control}
                render={({ field }) => (
                  <Stack spacing={8} data-test-id="push-content-container">
                    <Text weight="bold">Message</Text>
                    <CustomCodeEditor
                      value={(field.value as string) || ''}
                      onChange={(value) => {
                        handleContentChange(value, field.onChange);
                      }}
                    />
                  </Stack>
                )}
              />
            </When>
          </Stack>
          <EditVariablesModal
            open={editVariablesModalOpened}
            setOpen={setEditVariablesModalOpen}
            variablesArray={variablesArray}
          />
        </Grid.Col>
        <Grid.Col span={'content'}>
          <Flex justify="center">
            <PushPreview controlVariables={controlVariables} showLoading={isPreviewLoading} showOverlay={false} />
          </Flex>
        </Grid.Col>
      </Grid>
    </>
  );
}
