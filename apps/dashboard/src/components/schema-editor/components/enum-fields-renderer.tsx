import { Controller, useFieldArray, type Control, type UseFormGetValues } from 'react-hook-form';
import { RiAddLine, RiDeleteBinLine, RiErrorWarningLine } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import { InputPure, InputRoot } from '@/components/primitives/input';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/primitives/tooltip';
import { cn } from '@/utils/ui';
import type { JSONSchema7 } from '../json-schema';
import { getMarginClassPx } from '../utils/ui-helpers';

type EnumFieldsRendererProps = {
  pathPrefix: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>;
  currentPropertySchema: JSONSchema7 | undefined;
  indentationLevel: number;
  isDisabled?: boolean;
};

export function EnumFieldsRenderer({
  pathPrefix,
  control,
  getValues,
  currentPropertySchema,
  indentationLevel,
  isDisabled = false,
}: EnumFieldsRendererProps) {
  const enumFieldArrayPath = `${pathPrefix}.enum`;

  const {
    fields: enumFields,
    append: appendEnum,
    remove: removeEnum,
  } = useFieldArray({
    control,
    name: enumFieldArrayPath,
  });

  if (
    !(currentPropertySchema?.enum && currentPropertySchema.type === 'string') &&
    !(
      currentPropertySchema?.enum &&
      Array.isArray(currentPropertySchema.type) &&
      currentPropertySchema.type.includes('string')
    ) &&
    !currentPropertySchema?.enum
  ) {
    // Only render if enum is present. It might be an empty array initially.
    // Also ensure type is string or array of types including string, as enums are typically strings.
    // This check can be refined based on how strictly enums should be typed.
    return null;
  }

  return (
    <div className={cn('flex flex-col space-y-1 pt-1', getMarginClassPx(indentationLevel + 1))}>
      {(enumFields || []).map((field, enumIndex) => {
        const enumValuePath = `${pathPrefix}.enum.${enumIndex}` as const;

        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Controller
              name={enumValuePath}
              control={control}
              defaultValue={getValues(enumValuePath) || ''}
              rules={{ required: 'Choice cannot be empty' }} // Basic validation
              render={({ field: enumValueField, fieldState }) => (
                <InputRoot hasError={!!fieldState.error} size="2xs" className="flex-1">
                  <InputPure
                    {...enumValueField}
                    placeholder={`Choice ${enumIndex + 1}`}
                    className="pl-2 text-xs"
                    disabled={isDisabled}
                  />
                  {fieldState.error && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip open>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-default items-center justify-center pl-1">
                            <RiErrorWarningLine className="text-destructive h-3 w-3 shrink-0" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={4} className="text-xs">
                          <p>{fieldState.error.message}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </InputRoot>
              )}
            />
            <Button
              variant="error"
              mode="ghost"
              size="2xs"
              leadingIcon={RiDeleteBinLine}
              className="h-8 w-8"
              onClick={() => removeEnum(enumIndex)}
              disabled={isDisabled}
              aria-label={`Delete choice ${enumIndex + 1}`}
            />
          </div>
        );
      })}
      <div>
        <Button
          variant="secondary"
          mode="lighter"
          size="2xs"
          className={cn('mt-1')}
          leadingIcon={RiAddLine}
          onClick={() => appendEnum('', { shouldFocus: true })}
          disabled={isDisabled}
        >
          Add choice
        </Button>
      </div>
    </div>
  );
}
