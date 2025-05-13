import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch, type Control } from 'react-hook-form';
import { RiAddLine, RiDeleteBin6Line, RiDeleteBinLine, RiSettings4Line, RiErrorWarningLine } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import { Input, InputPure, InputRoot, InputWrapper } from '@/components/primitives/input';
import { Popover, PopoverTrigger } from '@/components/primitives/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import { cn } from '@/utils/ui';
import { Code2 } from '../icons/code-2';
import { SCHEMA_TYPE_OPTIONS } from './constants';
import { SchemaPropertySettingsPopover } from './schema-property-settings-popover';
import type { SchemaProperty, SchemaValueType } from './types';
import { createNewProperty } from './utils/property-helpers';

const getMarginClassPx = (level: number): string => {
  if (level <= 0) return 'ml-0';
  if (level === 1) return 'ml-[24px]';
  if (level === 2) return 'ml-[48px]';
  if (level === 3) return 'ml-[72px]';
  if (level === 4) return 'ml-[96px]';

  return `ml-[${level * 24}px]`;
};

interface SchemaPropertyRowProps {
  control: Control<any>;
  index: number;
  pathPrefix: string;
  property: SchemaProperty;
  onDeleteProperty: () => void;
  indentationLevel?: number;
}

export function SchemaPropertyRow(props: SchemaPropertyRowProps) {
  const { control, index, pathPrefix, property, onDeleteProperty, indentationLevel = 0 } = props;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { setValue, getValues } = useFormContext();

  const currentType = useWatch({
    control,
    name: `${pathPrefix}.type`,
  }) as SchemaValueType;

  const currentArrayItemType = useWatch({
    control,
    name: `${pathPrefix}.arrayItemType`,
  }) as SchemaValueType;

  useEffect(() => {
    const schemaProp = getValues(pathPrefix) as SchemaProperty | undefined;
    if (!schemaProp) return;

    if (currentType !== 'enum' && schemaProp.enumValues && schemaProp.enumValues.length > 0) {
      setValue(`${pathPrefix}.enumValues`, []);
    }

    if (currentType !== 'object' && schemaProp.children && schemaProp.children.length > 0) {
      setValue(`${pathPrefix}.children`, []);
    }

    if (
      currentType !== 'array' &&
      ((schemaProp.arrayItemSchema && schemaProp.arrayItemSchema.length > 0) || schemaProp.arrayItemType !== 'string')
    ) {
      setValue(`${pathPrefix}.arrayItemType`, 'string');
      setValue(`${pathPrefix}.arrayItemSchema`, []);
    }
  }, [currentType, pathPrefix, setValue, getValues]);

  const {
    fields: enumFields,
    append: appendEnum,
    remove: removeEnum,
  } = useFieldArray({
    control,
    name: `${pathPrefix}.enumValues`,
  });

  const {
    fields: childFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: `${pathPrefix}.children`,
  });

  const {
    fields: arrayItemFields,
    append: appendArrayItem,
    remove: removeArrayItem,
  } = useFieldArray({
    control,
    name: `${pathPrefix}.arrayItemSchema`,
  });

  const handleSaveSettings = (updatedSettings: Partial<SchemaProperty>) => {
    Object.entries(updatedSettings).forEach(([key, value]) => {
      setValue(`${pathPrefix}.${key}`, value);
    });
    setIsSettingsOpen(false);
  };

  return (
    <>
      <div className={cn('flex flex-col')}>
        <div className={cn('flex items-center space-x-2 py-0.5', getMarginClassPx(indentationLevel))}>
          <div className="flex-1 flex-col">
            <Controller
              name={`${pathPrefix}.name`}
              control={control}
              render={({ field, fieldState }) => (
                <div className="relative">
                  <TooltipProvider delayDuration={0}>
                    <InputRoot hasError={!!fieldState.error} size="2xs" className="font-mono">
                      <InputWrapper>
                        <Code2 className="h-4 w-4 shrink-0 text-gray-500" />
                        <InputPure {...field} placeholder="Property name" className="text-xs" />
                        {fieldState.error && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-default items-center justify-center">
                                <RiErrorWarningLine className="text-destructive h-4 w-4 shrink-0" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={5}>
                              <p>{fieldState.error.message}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </InputWrapper>
                    </InputRoot>
                  </TooltipProvider>
                </div>
              )}
            />
          </div>
          <Controller
            name={`${pathPrefix}.type`}
            control={control}
            render={({ field }) => (
              <Select value={field.value as string | undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-[120px] text-sm" size="2xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMA_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                mode="outline"
                size="2xs"
                className="text-text-soft"
                leadingIcon={RiSettings4Line}
              />
            </PopoverTrigger>
            {isSettingsOpen && (
              <SchemaPropertySettingsPopover
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                property={property as SchemaProperty}
                onSave={handleSaveSettings}
                onDelete={onDeleteProperty}
              />
            )}
          </Popover>
          <Button variant="error" mode="outline" size="2xs" leadingIcon={RiDeleteBin6Line} onClick={onDeleteProperty} />
        </div>

        {currentType === 'enum' && (
          <div className={cn('flex flex-col space-y-1 pt-1', getMarginClassPx(indentationLevel + 1))}>
            {enumFields.map((field, enumIndex) => {
              const enumPath = `${pathPrefix}.enumValues.${enumIndex}` as const;
              return (
                <div key={field.id} className="flex items-center space-x-2">
                  <Controller
                    name={enumPath}
                    control={control}
                    defaultValue={getValues(enumPath) || ''}
                    render={({ field: enumValueField }) => (
                      <Input {...enumValueField} placeholder={`item${enumIndex + 1}`} className="h-8 text-sm" />
                    )}
                  />
                  <Input disabled value="string" className="h-8 w-[100px] bg-gray-50 text-sm text-gray-400" />
                  <Button
                    variant="error"
                    mode="ghost"
                    size="2xs"
                    leadingIcon={RiDeleteBinLine}
                    className="h-8 w-8"
                    onClick={() => removeEnum(enumIndex)}
                  />
                </div>
              );
            })}
            <div>
              <Button
                variant="secondary"
                mode="lighter"
                size="2xs"
                className={cn('mt-1', getMarginClassPx(indentationLevel + 1))}
                leadingIcon={RiAddLine}
                onClick={() => appendEnum('', { shouldFocus: true })}
              >
                Add choice
              </Button>
            </div>
          </div>
        )}

        {currentType === 'array' && (
          <div className={cn('flex flex-col space-y-1 pt-1')}>
            <div className={cn('flex items-center space-x-2', getMarginClassPx(indentationLevel + 1))}>
              <span className="text-sm text-gray-500">items</span>
              <Controller
                name={`${pathPrefix}.arrayItemType`}
                control={control}
                defaultValue="string"
                render={({ field }) => (
                  <Select value={field.value as string | undefined} onValueChange={field.onChange}>
                    <SelectTrigger size="2xs" className="w-[120px] text-sm">
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEMA_TYPE_OPTIONS.filter((opt) => opt.value !== 'enum').map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {currentArrayItemType === 'object' && (
              <div className={cn('flex flex-col space-y-1 pt-1')}>
                {arrayItemFields.map((itemField, itemIndex) => (
                  <SchemaPropertyRow
                    key={itemField.id}
                    control={control}
                    index={itemIndex}
                    pathPrefix={`${pathPrefix}.arrayItemSchema.${itemIndex}`}
                    property={itemField as any as SchemaProperty}
                    onDeleteProperty={() => removeArrayItem(itemIndex)}
                    indentationLevel={indentationLevel + 1}
                  />
                ))}
                <div>
                  <Button
                    variant="secondary"
                    mode="lighter"
                    size="2xs"
                    className={cn('mt-1', getMarginClassPx(indentationLevel + 1))}
                    leadingIcon={RiAddLine}
                    onClick={() => appendArrayItem(createNewProperty(), { shouldFocus: false })}
                  >
                    Add property to item
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentType === 'object' && (
          <div className={cn('flex flex-col space-y-1 pt-1')}>
            {childFields.map((childPropertyField, childIndex) => (
              <SchemaPropertyRow
                key={childPropertyField.id}
                control={control}
                index={childIndex}
                pathPrefix={`${pathPrefix}.children.${childIndex}`}
                property={childPropertyField as any as SchemaProperty}
                onDeleteProperty={() => removeChild(childIndex)}
                indentationLevel={indentationLevel + 1}
              />
            ))}
            <div className={cn(getMarginClassPx(indentationLevel + 1))}>
              <Button
                variant="secondary"
                mode="lighter"
                size="2xs"
                className="mt-1"
                leadingIcon={RiAddLine}
                onClick={() => appendChild(createNewProperty(), { shouldFocus: false })}
              >
                Add nested property
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
