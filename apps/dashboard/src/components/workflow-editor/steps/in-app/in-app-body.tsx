import { useFormContext } from 'react-hook-form';

import { ControlInput } from '@/components/primitives/control-input';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/primitives/form/form';
import { useWorkflow } from '@/components/workflow-editor/workflow-provider';
import { useParseVariables } from '@/hooks/use-parse-variables';
import { capitalize, containsHTMLEntities, containsVariables } from '@/utils/string';
import { InputRoot } from '../../../primitives/input';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/utils/query-keys';
import { useEnvironment } from '@/context/environment/hooks';
import { getWorkflowIdFromSlug, WORKFLOW_DIVIDER } from '@/utils/step';

const bodyKey = 'body';

export const InAppBody = () => {
  const { control, getValues, trigger } = useFormContext();
  const { step, digestStepBeforeCurrent, workflow } = useWorkflow();
  const { variables, isAllowedVariable } = useParseVariables(step?.variables, digestStepBeforeCurrent?.stepId);
  const queryClient = useQueryClient();
  const { currentEnvironment } = useEnvironment();

  const handleWorkflowSchemaSaved = async () => {
    if (!workflow?.slug || !currentEnvironment?._id) {
      return;
    }

    const workflowId = getWorkflowIdFromSlug({ slug: workflow.slug, divider: WORKFLOW_DIVIDER });

    try {
      await queryClient.invalidateQueries({
        queryKey: [QueryKeys.fetchWorkflow, currentEnvironment._id, workflowId],
      });
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.fetchWorkflow, currentEnvironment._id, workflowId],
        exact: true,
      });

      await trigger(bodyKey);
    } catch (error) {
      console.error('Error during workflow refetch or field validation trigger:', error);
    }
  };

  return (
    <FormField
      control={control}
      name={bodyKey}
      render={({ field, fieldState }) => (
        <FormItem className="w-full">
          <FormControl>
            <InputRoot hasError={!!fieldState.error}>
              <ControlInput
                className="min-h-[7rem]"
                indentWithTab={false}
                placeholder={capitalize(field.name)}
                id={field.name}
                value={field.value}
                onChange={field.onChange}
                variables={variables}
                isAllowedVariable={isAllowedVariable}
                onWorkflowSchemaSaved={handleWorkflowSchemaSaved}
                multiline
              />
            </InputRoot>
          </FormControl>
          <FormMessage>
            {containsHTMLEntities(field.value) && !getValues('disableOutputSanitization')
              ? 'HTML entities detected. Consider disabling content sanitization for proper rendering'
              : field.value.length > 2 && !containsVariables(field.value)
                ? `Type {{ for variables, or wrap text in ** for bold.`
                : ''}
          </FormMessage>
        </FormItem>
      )}
    />
  );
};
