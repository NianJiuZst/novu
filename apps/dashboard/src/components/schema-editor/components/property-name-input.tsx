import { useEffect } from 'react';
import { Controller, type Control, type FieldValues, useFormContext } from 'react-hook-form';
import { RiErrorWarningLine } from 'react-icons/ri';

import { InputPure, InputRoot, InputWrapper } from '@/components/primitives/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import { Code2 } from '../../icons/code-2';
import { cn } from '@/utils/ui';

// path: the direct RHF path to the keyName field, e.g., "propertyList.0.keyName"
// control: the main form's control object
type PropertyNameInputProps = {
  fieldPath: string;
  control: Control<FieldValues>; // Or more specific type if SchemaEditorFormValues is accessible
  isDisabled?: boolean;
  placeholder?: string;
};

export function PropertyNameInput({
  fieldPath,
  control,
  isDisabled = false,
  placeholder = 'Property name',
}: PropertyNameInputProps) {
  // Removed all local state, useEffect for blanking UUIDs, custom __tempNameKey logic.
  // This component is now a simple controlled input via RHF Controller.
  // Zod validation on PropertyListItemSchema.keyName will provide errors directly.

  // // console.log(`[PropertyNameInput for path "${fieldPath}"] Rendering.`);

  return (
    <div className="flex-1 flex-col">
      <Controller
        name={fieldPath as any} // Path like "propertyList.0.keyName"
        control={control}
        // defaultValue can be omitted if the parent useFieldArray/form sets initial values (e.g., keyName: '')
        render={({ field, fieldState }) => {
          // // console.log(`[PropertyNameInput for "${fieldPath}"] fieldState.error:`, fieldState.error ? JSON.parse(JSON.stringify(fieldState.error)) : null, "Value:", field.value);
          return (
            <InputRoot
              hasError={!!fieldState.error}
              size="2xs"
              className={cn(
                'font-mono'
                // { 'border-red-500 border-2': !!fieldState.error } // REMOVE Temporary diagnostic style
              )}
            >
              <InputWrapper>
                <Code2 className="h-4 w-4 shrink-0 text-gray-500" />
                <InputPure
                  {...field} // spread field props (onChange, onBlur, value, ref)
                  placeholder={placeholder}
                  className="text-xs"
                  disabled={isDisabled}
                  // autoFocus can be useful for newly added fields if we can detect that
                />
                {fieldState.error && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-default items-center justify-center pl-1 pr-1">
                          <RiErrorWarningLine
                            className={cn(
                              'text-destructive h-4 w-4 shrink-0'
                              // { 'bg-yellow-300': !!fieldState.error } // REMOVE Temporary diagnostic style
                            )}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={5}>
                        <p>{fieldState.error.message}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </InputWrapper>
            </InputRoot>
          );
        }}
      />
    </div>
  );
}
