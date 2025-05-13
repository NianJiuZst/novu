import { useState, useEffect } from 'react';
import {
  RiSettings3Line,
  RiDeleteBinLine,
  RiAddLine,
  RiBracesLine,
  RiSettings4Line,
  RiDeleteBin6Line,
} from 'react-icons/ri';
import { Controller, useFormContext, useFieldArray, useWatch, type Control } from 'react-hook-form';

import { Input, InputRoot, InputWrapper, InputPure } from '@/components/primitives/input';
import { Button } from '@/components/primitives/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { Popover, PopoverTrigger } from '@/components/primitives/popover';
import type { SchemaProperty, SchemaValueType } from './types';
import { SCHEMA_TYPE_OPTIONS } from './constants';
import { cn } from '@/utils/ui';
import { SchemaPropertySettingsPopover } from './schema-property-settings-popover';
import { createNewProperty } from './utils/property-helpers';
import { Code2 } from '../icons/code-2';

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
      <div className={cn('flex flex-col', indentationLevel > 0 && `ml-${indentationLevel * 6}`)}>
        <div className="flex items-center space-x-2 py-1">
          <div className="flex-1 flex-col">
            <Controller
              name={`${pathPrefix}.name`}
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputRoot hasError={!!fieldState.error} size="2xs" className="font-mono">
                    <InputWrapper>
                      <Code2 className="h-4 w-4 shrink-0 text-gray-500" />
                      <InputPure {...field} placeholder="Property name" className="text-sm" />
                    </InputWrapper>
                  </InputRoot>
                  {fieldState.error && <p className="text-destructive mt-1 text-xs">{fieldState.error.message}</p>}
                </>
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
          <div className={cn('ml-6 flex flex-col space-y-1 pt-1')}>
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
                    size="xs"
                    leadingIcon={RiDeleteBinLine}
                    className="h-8 w-8"
                    onClick={() => removeEnum(enumIndex)}
                  />
                </div>
              );
            })}
            <Button
              variant="secondary"
              mode="outline"
              size="sm"
              className="mt-1 h-8 w-fit self-start text-xs"
              leadingIcon={RiAddLine}
              onClick={() => appendEnum('', { shouldFocus: true })}
            >
              Add choice
            </Button>
          </div>
        )}

        {currentType === 'array' && (
          <div className={cn('ml-6 flex flex-col space-y-1 pt-1')}>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">items</span>
              <Controller
                name={`${pathPrefix}.arrayItemType`}
                control={control}
                defaultValue="string"
                render={({ field }) => (
                  <Select value={field.value as string | undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 w-[120px] text-sm">
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
              <div className={cn('ml-6 flex flex-col space-y-1 pt-1')}>
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
                <Button
                  variant="secondary"
                  mode="outline"
                  size="sm"
                  className="mt-1 h-8 w-fit self-start text-xs"
                  leadingIcon={RiAddLine}
                  onClick={() => appendArrayItem(createNewProperty(), { shouldFocus: false })}
                >
                  Add property to item
                </Button>
              </div>
            )}
          </div>
        )}

        {currentType === 'object' && (
          <div className={cn('ml-6 flex flex-col space-y-1 pt-1')}>
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
            <div>
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
