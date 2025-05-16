import { useEffect } from 'react';
import { Controller, type Control, type FieldValues, useFormContext } from 'react-hook-form';
import { RiErrorWarningLine } from 'react-icons/ri';

import { InputPure, InputRoot, InputWrapper } from '@/components/primitives/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import { Code2 } from '../../icons/code-2';
import type { JSONSchema7 } from '../json-schema'; // Import JSONSchema7 type

type PropertyNameInputProps = {
  propertyKey: string; // Still needed for initial value and to detect actual change
  pathPrefix: string; // Used to construct the field path for the controller
  onAttemptRename: (oldKey: string, newKeyAttempt: string) => void;
  control: Control<FieldValues>;
  isDisabled?: boolean;
};

export function PropertyNameInput({
  propertyKey,
  pathPrefix,
  onAttemptRename,
  control,
  isDisabled = false,
}: PropertyNameInputProps) {
  // The actual name field for react-hook-form will be a unique path
  // that doesn't directly map to the schema structure, to avoid conflicts
  // and allow RHF to manage its state independently until we commit the change.
  // However, for validation, we need to ensure the Zod schema path is correct.
  // This component will now primarily rely on the parent (SchemaPropertyRow) to handle the rename logic via onAttemptRename.

  // We use a unique field name for react-hook-form for this input.
  // The actual update to the schema structure (and its key) happens via `onAttemptRename`.
  const formFieldName = `${pathPrefix}.${propertyKey}__tempNameKey` as const;

  const { getFieldState, setValue, getValues } = useFormContext(); // To get errors for this specific input if needed

  // If propertyKey (the actual key in the schema) changes from parent,
  // we need to ensure the input field reflects this new key if it's being freshly rendered or re-keyed.
  // The `defaultValue` in Controller handles initial render. If `propertyKey` itself is part of Controller's `key` prop,
  // it would remount. Alternatively, `resetField` or `setValue` can be used.
  useEffect(() => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Attempt to get the schema fragment associated with this propertyKey via pathPrefix
    // pathPrefix would be something like `schema.properties.uuid_for_the_property`
    // So, we use pathPrefix directly as it should point to the property's schema object.
    const schemaFragment = getValues(pathPrefix) as JSONSchema7 | undefined;

    let initialValue = propertyKey;

    if (uuidPattern.test(propertyKey)) {
      // If the key is a UUID, check if it represents a truly new, unedited property.
      // A simple check could be if it lacks a title or description, common user-set fields.
      // Or, if we introduce a specific marker for "newness", we check that.
      // For now, let's assume if it's a UUID and has no title/description, it should appear empty.
      if (!schemaFragment?.title && !schemaFragment?.description) {
        initialValue = '';
      }
    }

    setValue(formFieldName, initialValue, { shouldValidate: false, shouldDirty: false });
  }, [propertyKey, pathPrefix, formFieldName, setValue, getValues]);

  // This component no longer manages localName or local validation.
  // It calls `onAttemptRename` on blur or Enter.

  return (
    <div className="flex-1 flex-col">
      <Controller
        name={formFieldName} // Unique name for RHF to track this input field
        control={control}
        // defaultValue is critical for initial hydration when the controller mounts.
        // The useEffect above handles subsequent updates if propertyKey changes or needs to be blanked out.
        defaultValue={(() => {
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const schemaFragment = getValues(pathPrefix) as JSONSchema7 | undefined;

          if (uuidPattern.test(propertyKey) && !schemaFragment?.title && !schemaFragment?.description) {
            return '';
          }

          return propertyKey;
        })()}
        // rules: {
        //   // We could put client-side validation here if we didn't want to rely solely on Zod
        //   // e.g., required: 'Property name cannot be empty.'
        //   // pattern: { value: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: 'Invalid name format.' }
        // },
        // The Zod schema in SchemaEditor will handle the true validation upon attempted rename.
        render={({ field, fieldState }) => {
          // field.value will be managed by RHF.
          // We ensure onAttemptRename is called with the latest value.
          const handleBlur = () => {
            onAttemptRename(propertyKey, field.value);
          };

          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAttemptRename(propertyKey, field.value);
            }

            if (e.key === 'Escape') {
              e.preventDefault();
              field.onChange(propertyKey); // Revert to original propertyKey
            }
          };

          return (
            <InputRoot hasError={!!fieldState.error} size="2xs" className="font-mono">
              <InputWrapper>
                <Code2 className="h-4 w-4 shrink-0 text-gray-500" />
                <InputPure
                  {...field} // spread field props
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Property name"
                  className="text-xs"
                  disabled={isDisabled}
                />
                {fieldState.error && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip open>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-default items-center justify-center">
                          <RiErrorWarningLine className="text-destructive h-4 w-4 shrink-0" />
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
