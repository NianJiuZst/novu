import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField, FormItem, FormLabel, FormMessage } from '@/components/primitives/form/form';
import { useWorkflow } from '@/components/workflow-editor/workflow-provider';
import { parseStepVariablesToLiquidVariables } from '@/utils/parseStepVariablesToLiquidVariables';
import { ControlInput } from '../../../primitives/control-input';
import { InputRoot, InputWrapper } from '../../../primitives/input';
import { StaticVariablePill } from '../../../primitives/control-input/variable-plugin/static-variable-pill';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../primitives/tooltip';

export const DigestKey = () => {
  const { control } = useFormContext();
  const { step } = useWorkflow();
  const variables = useMemo(() => (step ? parseStepVariablesToLiquidVariables(step.variables) : []), [step]);

  return (
    <FormField
      control={control}
      name="controlValues.digestKey"
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <>
            <FormLabel tooltip="Digest is grouped by the subscriberId by default. You can add one more aggregation key to group events further.">
              Group events by
            </FormLabel>
            <InputRoot>
              <InputWrapper className="flex h-[28px] items-center gap-1 border-r border-neutral-100 pr-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex">
                      <StaticVariablePill className="flex" text="subscriberId" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>this is a default key</TooltipContent>
                </Tooltip>
                <ControlInput
                  multiline={false}
                  indentWithTab={false}
                  placeholder="Add additional digest..."
                  id={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  variables={variables}
                  size="sm"
                />
              </InputWrapper>
            </InputRoot>
            <FormMessage />
          </>
        </FormItem>
      )}
    />
  );
};
