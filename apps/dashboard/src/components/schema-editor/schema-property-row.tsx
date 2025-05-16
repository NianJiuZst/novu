import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch, type Control, type FieldValues } from 'react-hook-form';
import { RiAddLine, RiDeleteBin6Line, RiDeleteBinLine, RiSettings4Line, RiErrorWarningLine } from 'react-icons/ri';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/primitives/button';
import { Input, InputPure, InputRoot } from '@/components/primitives/input';
import { Popover, PopoverTrigger } from '@/components/primitives/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import { cn } from '@/utils/ui';

import type { JSONSchema7, JSONSchema7TypeName } from './json-schema';
import { SchemaPropertySettingsPopover } from './schema-property-settings-popover';
import { newProperty } from './utils/json-helpers';
import { getMarginClassPx } from './utils/ui-helpers';

// Import new sub-components
import { PropertyNameInput } from './components/property-name-input';
import { PropertyTypeSelector } from './components/property-type-selector';

import { Checkbox } from '@/components/primitives/checkbox';
import { Label } from '@/components/primitives/label';

import type { PropertyListItem } from './utils/validation-schema';

export interface SchemaPropertyRowProps {
  control: Control<any>;
  index: number;
  pathPrefix: string;
  onDeleteProperty: () => void;
  indentationLevel?: number;
}

export function SchemaPropertyRow(props: SchemaPropertyRowProps) {
  const { control, index, pathPrefix, onDeleteProperty, indentationLevel = 0 } = props;

  const { setValue, getValues, watch: watchForm } = useFormContext();

  const propertyListItem = watchForm(`${pathPrefix}`) as PropertyListItem;
  const definitionPath = `${pathPrefix}.definition`;
  const currentDefinition = propertyListItem?.definition as JSONSchema7 | undefined;

  // // useEffect(() => {
  // //   console.log(`[SchemaPropertyRow path="${pathPrefix}"] Watched currentDefinition:`, JSON.stringify(currentDefinition));
  // // }, [currentDefinition, pathPrefix]);

  const currentType = useMemo(() => {
    if (!currentDefinition) return undefined;
    if (Array.isArray(currentDefinition.enum)) return 'enum';
    if (currentDefinition.type === 'object') return 'object';
    if (currentDefinition.type === 'array') return 'array';
    return currentDefinition.type as JSONSchema7TypeName | undefined;
  }, [currentDefinition]);

  const keyNamePath = `${pathPrefix}.keyName`;
  const isRequiredPath = `${pathPrefix}.isRequired`;

  const enumArrayPath = `${definitionPath}.enum`;
  const enumFieldArrayHook = useFieldArray({
    control,
    name: currentType === 'enum' ? (enumArrayPath as any) : `_unused_enum_path_.${index}`,
    keyName: 'enumChoiceId',
  });
  const enumFields = currentType === 'enum' ? enumFieldArrayHook.fields : [];

  const appendEnumChoice = currentType === 'enum' ? enumFieldArrayHook.append : () => {};

  const removeEnumChoice = currentType === 'enum' ? enumFieldArrayHook.remove : () => {};

  const nestedPropertyListPath = `${definitionPath}.propertyList`;
  const objectFieldArray = useFieldArray({
    control,
    name: currentType === 'object' ? (nestedPropertyListPath as any) : `_unused_object_path_.${index}`,
    keyName: 'nestedFieldId',
  });
  const nestedFields = currentType === 'object' ? objectFieldArray.fields : [];

  const appendNested = currentType === 'object' ? objectFieldArray.append : () => {};

  const removeNested = currentType === 'object' ? objectFieldArray.remove : () => {};

  const handleAddNestedProperty = useCallback(() => {
    if (currentType !== 'object') {
      setValue(`${definitionPath}.type`, 'object', { shouldValidate: true });
      setValue(nestedPropertyListPath, [], { shouldValidate: true });
      return;
    }

    if (typeof appendNested === 'function') {
      appendNested({
        id: uuidv4(),
        keyName: '',
        definition: newProperty('string'),
        isRequired: false,
      } as PropertyListItem);
    }
  }, [currentType, setValue, definitionPath, nestedPropertyListPath, appendNested]);

  // Logic for array items of type object
  const itemSchemaObjectPath = `${definitionPath}.items`; // Path to the item's schema definition object
  const itemSchemaObject = useWatch({ control, name: itemSchemaObjectPath }) as JSONSchema7 | undefined;
  const itemIsObject = currentType === 'array' && itemSchemaObject?.type === 'object';
  const itemPropertiesListPath = `${itemSchemaObjectPath}.propertyList`; // Path to the list of properties FOR the item, if it's an object

  const arrayItemObjectFieldArray = useFieldArray({
    control,
    name: itemIsObject ? (itemPropertiesListPath as any) : `_unused_array_item_object_path_.${index}`,
    keyName: 'itemNestedFieldId',
  });
  const itemNestedFields = itemIsObject ? arrayItemObjectFieldArray.fields : [];

  const appendItemNested = itemIsObject ? arrayItemObjectFieldArray.append : () => {};

  const removeItemNested = itemIsObject ? arrayItemObjectFieldArray.remove : () => {};

  const handleAddArrayItemObjectProperty = useCallback(() => {
    if (!itemIsObject) return;
    const currentList = getValues(itemPropertiesListPath);

    if (!Array.isArray(currentList)) {
      setValue(itemPropertiesListPath, [], { shouldValidate: false });
    }

    if (typeof appendItemNested === 'function') {
      appendItemNested({
        id: uuidv4(),
        keyName: '',
        definition: newProperty('string'),
        isRequired: false,
      } as PropertyListItem);
    }
  }, [itemIsObject, getValues, setValue, itemPropertiesListPath, appendItemNested]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!propertyListItem) {
    return null;
  }

  const currentKeyName = propertyListItem.keyName;

  return (
    <div
      className={cn(
        'flex flex-col border-b border-neutral-100 py-1 last:border-b-0' /*getMarginClassPx(indentationLevel)*/
      )}
    >
      <div className={cn('flex items-center space-x-2', getMarginClassPx(indentationLevel))}>
        <PropertyNameInput fieldPath={keyNamePath} control={control} />
        <PropertyTypeSelector
          definitionPath={definitionPath}
          control={control}
          setValue={setValue}
          getValues={getValues}
        />
        <div className="ml-auto flex items-center space-x-1.5">
          <Controller
            name={isRequiredPath as any}
            control={control}
            render={({ field }) => (
              <Checkbox
                id={`${pathPrefix}-isRequired-checkbox`}
                checked={!!field.value}
                onCheckedChange={field.onChange}
                disabled={propertyListItem?.keyName?.trim() === ''}
              />
            )}
          />
          <Label
            htmlFor={`${pathPrefix}-isRequired-checkbox`}
            className="select-none whitespace-nowrap text-xs text-gray-600"
          >
            Required
          </Label>
        </div>
        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              mode="ghost"
              size="2xs"
              className="p-1"
              leadingIcon={RiSettings4Line}
              disabled={!currentKeyName || currentKeyName.trim() === ''}
            />
          </PopoverTrigger>
          <SchemaPropertySettingsPopover
            definitionPath={definitionPath}
            propertyKeyForDisplay={currentKeyName || ''}
            isRequiredPath={isRequiredPath}
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            onDeleteProperty={onDeleteProperty}
          />
        </Popover>
        <Button
          variant="error"
          mode="ghost"
          size="2xs"
          onClick={onDeleteProperty}
          leadingIcon={RiDeleteBinLine}
          className="p-1"
        />
      </div>

      {currentType === 'enum' && (
        <div className={cn('ml-4 mt-1 space-y-1', getMarginClassPx(indentationLevel))}>
          {enumFields.map((enumField, enumIndex) => {
            const enumChoicePath = `${enumArrayPath}.${enumIndex}`;
            return (
              <div key={(enumField as any).enumChoiceId} className="flex items-center space-x-2">
                <Controller
                  name={enumChoicePath as any}
                  control={control}
                  render={({ field: choiceField, fieldState: choiceFieldState }) => (
                    <InputRoot hasError={!!choiceFieldState.error} size="2xs" className="flex-1">
                      <InputPure {...choiceField} placeholder={`Choice ${enumIndex + 1}`} className="pl-2 text-xs" />
                      {choiceFieldState.error && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-default items-center justify-center pl-1">
                                <RiErrorWarningLine className="text-destructive h-3 w-3 shrink-0" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={4} className="text-xs">
                              <p>{choiceFieldState.error.message}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </InputRoot>
                  )}
                />
                <Button
                  variant="secondary"
                  mode="outline"
                  size="2xs"
                  onClick={() => removeEnumChoice(enumIndex)}
                  leadingIcon={RiDeleteBinLine}
                  className="h-7 w-7 p-1"
                />
              </div>
            );
          })}
          <Button
            size="2xs"
            variant="secondary"
            mode="outline"
            onClick={() => appendEnumChoice('', { shouldFocus: true })}
            leadingIcon={RiAddLine}
            className="mt-1"
          >
            Add Choice
          </Button>
        </div>
      )}

      {currentType === 'object' && (
        <div className={cn('pl-4 pt-1', getMarginClassPx(indentationLevel))}>
          {nestedFields.map((nestedField, nestedIndex) => (
            <SchemaPropertyRow
              key={(nestedField as any).nestedFieldId}
              control={control}
              index={nestedIndex}
              pathPrefix={`${nestedPropertyListPath}.${nestedIndex}`}
              onDeleteProperty={() => removeNested(nestedIndex)}
              indentationLevel={indentationLevel + 1}
            />
          ))}
          <Button
            size="2xs"
            variant="secondary"
            mode="outline"
            onClick={handleAddNestedProperty}
            leadingIcon={RiAddLine}
            className="ml-4 mt-1"
          >
            Add Nested Property
          </Button>
        </div>
      )}

      {/* Render Array item schema controls */}
      {currentType === 'array' && currentDefinition && (
        <div
          className={cn(
            'ml-4 mt-2 rounded border border-dashed border-neutral-200 p-2',
            getMarginClassPx(indentationLevel)
          )}
        >
          <div className="mb-1 flex items-center space-x-2">
            <Label className="text-xs font-medium text-gray-700">Array Item Type:</Label>
            <PropertyTypeSelector
              definitionPath={itemSchemaObjectPath} // Controls the item's schema directly
              control={control}
              setValue={setValue}
              getValues={getValues}
            />
          </div>

          {itemIsObject && (
            <div className="mt-1 border-l border-neutral-200 pl-4">
              {itemNestedFields.map((itemNestedField, itemNestedIndex) => (
                <SchemaPropertyRow
                  key={(itemNestedField as any).itemNestedFieldId} // Use RHF provided key
                  control={control}
                  index={itemNestedIndex}
                  pathPrefix={`${itemPropertiesListPath}.${itemNestedIndex}`}
                  onDeleteProperty={() => removeItemNested(itemNestedIndex)}
                  indentationLevel={indentationLevel + 2} // Increase indent for item's properties
                />
              ))}
              <Button
                size="2xs"
                variant="secondary"
                mode="outline"
                onClick={handleAddArrayItemObjectProperty}
                leadingIcon={RiAddLine}
                className="mt-1"
              >
                Add Item Property
              </Button>
            </div>
          )}
          {/* Further controls for non-object array items could go here if needed */}
        </div>
      )}

      {/* Render Nested Object Properties (for the main property, not array items) */}
      {currentType === 'object' && (
        <div className={cn('pl-4 pt-1', getMarginClassPx(indentationLevel))}>
          {nestedFields.map((nestedField, nestedIndex) => (
            <SchemaPropertyRow
              key={(nestedField as any).nestedFieldId}
              control={control}
              index={nestedIndex}
              pathPrefix={`${nestedPropertyListPath}.${nestedIndex}`}
              onDeleteProperty={() => removeNested(nestedIndex)}
              indentationLevel={indentationLevel + 1}
            />
          ))}
          <Button
            size="2xs"
            variant="secondary"
            mode="outline"
            onClick={handleAddNestedProperty}
            leadingIcon={RiAddLine}
            className="ml-4 mt-1"
          >
            Add Nested Property
          </Button>
        </div>
      )}
    </div>
  );
}
