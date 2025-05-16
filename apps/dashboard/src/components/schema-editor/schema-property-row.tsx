import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch, type Control, type FieldValues } from 'react-hook-form';
import { RiAddLine, RiDeleteBin6Line, RiDeleteBinLine, RiSettings4Line, RiErrorWarningLine } from 'react-icons/ri';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/primitives/button';
import { Input, InputPure, InputRoot, InputWrapper } from '@/components/primitives/input';
import { Popover, PopoverTrigger } from '@/components/primitives/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import { cn } from '@/utils/ui';
import { Code2 } from '../icons/code-2';
import { SCHEMA_TYPE_OPTIONS } from './constants';
import type { JSONSchema7, JSONSchema7TypeName } from './json-schema';
import { SchemaPropertySettingsPopover } from './schema-property-settings-popover';
import {
  newProperty,
  ensureObject,
  ensureArray,
  ensureEnum,
  ensureString,
  ensureNumberOrInteger,
  ensureBoolean,
  ensureNull,
} from './utils/json-helpers';

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
  propertyKey: string;
  pathPrefix: string;
  onDeleteProperty: () => void;
  onRenamePropertyKey: (oldKey: string, newKey: string) => void | Error;
  indentationLevel?: number;
}

export function SchemaPropertyRow(props: SchemaPropertyRowProps) {
  const { control, propertyKey, pathPrefix, onDeleteProperty, onRenamePropertyKey, indentationLevel = 0 } = props;

  const { setValue, getValues } = useFormContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localName, setLocalName] = useState(propertyKey);
  const [nameError, setNameError] = useState<string | null>(null);

  const currentPropertySchema = useWatch({ control, name: pathPrefix }) as JSONSchema7 | undefined;

  const currentType = useMemo(() => {
    if (!currentPropertySchema) return undefined;
    if (currentPropertySchema.enum) return 'enum';
    if (currentPropertySchema.properties && !currentPropertySchema.type) return 'object';
    if (currentPropertySchema.items && !currentPropertySchema.type) return 'array';
    return currentPropertySchema.type as JSONSchema7TypeName | 'enum' | undefined;
  }, [currentPropertySchema]);

  const currentArrayItemType = useMemo(() => {
    if (currentType !== 'array' || !currentPropertySchema?.items || typeof currentPropertySchema.items !== 'object') {
      return undefined;
    }

    const itemSchema = currentPropertySchema.items as JSONSchema7;
    if (itemSchema.enum) return 'enum';
    if (itemSchema.properties && !itemSchema.type) return 'object';
    return itemSchema.type as JSONSchema7TypeName | 'enum' | undefined;
  }, [currentPropertySchema, currentType]);

  const childPropertyOrderRef = useRef<string[]>([]);
  const arrayItemPropertyOrderRef = useRef<string[]>([]);

  useEffect(() => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const schemaFragment = getValues(pathPrefix) as JSONSchema7 | undefined;

    if (uuidPattern.test(propertyKey) && (!schemaFragment || (!schemaFragment.title && !schemaFragment.description))) {
      setLocalName('');
    } else {
      setLocalName(propertyKey);
    }
  }, [propertyKey, getValues, pathPrefix]);

  useEffect(() => {
    if (currentPropertySchema) {
      if (currentType === 'object' && currentPropertySchema.properties) {
        const currentKeys = Object.keys(currentPropertySchema.properties);

        if (JSON.stringify(currentKeys) !== JSON.stringify(childPropertyOrderRef.current)) {
          childPropertyOrderRef.current = currentKeys;
        }
      } else if (childPropertyOrderRef.current.length > 0) {
        childPropertyOrderRef.current = [];
      }

      if (currentType === 'array' && currentArrayItemType === 'object') {
        const itemSchema = currentPropertySchema.items as JSONSchema7;

        if (itemSchema?.properties) {
          const currentItemKeys = Object.keys(itemSchema.properties);

          if (JSON.stringify(currentItemKeys) !== JSON.stringify(arrayItemPropertyOrderRef.current)) {
            arrayItemPropertyOrderRef.current = currentItemKeys;
          }
        } else if (arrayItemPropertyOrderRef.current.length > 0) {
          arrayItemPropertyOrderRef.current = [];
        }
      } else if (arrayItemPropertyOrderRef.current.length > 0) {
        arrayItemPropertyOrderRef.current = [];
      }
    }
  }, [currentPropertySchema, currentType, currentArrayItemType]);

  const handleNameChange = useCallback(
    async (newName: string) => {
      setNameError(null);
      const trimmedNewName = newName.trim();

      if (trimmedNewName === propertyKey) {
        setLocalName(propertyKey);
        return;
      }

      if (!trimmedNewName) {
        setNameError('Property name cannot be empty.');
        return;
      }

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedNewName)) {
        setNameError('Name must start with a letter or underscore, and contain only letters, numbers, or underscores.');
        return;
      }

      try {
        onRenamePropertyKey(propertyKey, trimmedNewName);
      } catch (e: any) {
        setNameError(e.message || 'Failed to rename property.');
      }
    },
    [propertyKey, onRenamePropertyKey]
  );

  const handleTypeChange = useCallback(
    (newSchemaType: JSONSchema7TypeName | 'enum') => {
      const currentSchema = getValues(pathPrefix) as JSONSchema7;
      if (!currentSchema) return;
      let newTransformedSchema: JSONSchema7;
      if (newSchemaType === 'enum') newTransformedSchema = ensureEnum(currentSchema);
      else if (newSchemaType === 'array') newTransformedSchema = ensureArray(currentSchema);
      else if (newSchemaType === 'object') newTransformedSchema = ensureObject(currentSchema);
      else if (newSchemaType === 'string') newTransformedSchema = ensureString(currentSchema);
      else if (newSchemaType === 'number' || newSchemaType === 'integer')
        newTransformedSchema = ensureNumberOrInteger(currentSchema, newSchemaType);
      else if (newSchemaType === 'boolean') newTransformedSchema = ensureBoolean(currentSchema);
      else if (newSchemaType === 'null') newTransformedSchema = ensureNull(currentSchema);
      else newTransformedSchema = { ...currentSchema, type: newSchemaType as JSONSchema7TypeName };
      setValue(pathPrefix, newTransformedSchema, { shouldValidate: true, shouldDirty: true });
    },
    [getValues, setValue, pathPrefix]
  );

  const handleArrayItemTypeChange = useCallback(
    (newItemSchemaType: JSONSchema7TypeName) => {
      const parentArraySchema = getValues(pathPrefix) as JSONSchema7;
      if (!parentArraySchema || parentArraySchema.type !== 'array') return;
      const currentItemSchema = (parentArraySchema.items as JSONSchema7) || {};
      let newTransformedItemSchema: JSONSchema7;
      if (newItemSchemaType === 'object') newTransformedItemSchema = ensureObject(currentItemSchema);
      else if (newItemSchemaType === 'string') newTransformedItemSchema = ensureString(currentItemSchema);
      else if (newItemSchemaType === 'number' || newItemSchemaType === 'integer')
        newTransformedItemSchema = ensureNumberOrInteger(currentItemSchema, newItemSchemaType);
      else if (newItemSchemaType === 'boolean') newTransformedItemSchema = ensureBoolean(currentItemSchema);
      else if (newItemSchemaType === 'null') newTransformedItemSchema = ensureNull(currentItemSchema);
      else newTransformedItemSchema = { ...currentItemSchema, type: newItemSchemaType };
      setValue(`${pathPrefix}.items`, newTransformedItemSchema, { shouldValidate: true, shouldDirty: true });
    },
    [getValues, setValue, pathPrefix]
  );

  const enumFieldArrayPath =
    currentType === 'enum' && pathPrefix ? `${pathPrefix}.enum` : 'schemaEditor.dummy.enumPath';
  const {
    fields: enumFields,
    append: appendEnum,
    remove: removeEnum,
  } = useFieldArray({
    control,
    name: enumFieldArrayPath,
  });

  const handleAddChildProperty = useCallback(() => {
    const childKey = uuidv4();
    const currentObjectSchema = getValues(pathPrefix) as JSONSchema7;
    const newChildProp = newProperty('string');
    const newChildProperties = { ...(currentObjectSchema.properties || {}), [childKey]: newChildProp };
    setValue(`${pathPrefix}.properties`, newChildProperties, { shouldValidate: true, shouldDirty: true });
    childPropertyOrderRef.current = [...(childPropertyOrderRef.current || []), childKey];
  }, [getValues, setValue, pathPrefix]);

  const handleDeleteChildProperty = useCallback(
    (childKeyToDelete: string) => {
      const currentObjectSchema = getValues(pathPrefix) as JSONSchema7;
      if (!currentObjectSchema.properties) return;
      const { [childKeyToDelete]: _, ...remainingChildProperties } = currentObjectSchema.properties;
      setValue(`${pathPrefix}.properties`, remainingChildProperties, { shouldValidate: true, shouldDirty: true });

      if (currentObjectSchema.required?.includes(childKeyToDelete)) {
        setValue(
          `${pathPrefix}.required`,
          currentObjectSchema.required.filter((reqKey: string) => reqKey !== childKeyToDelete),
          { shouldValidate: true, shouldDirty: true }
        );
      }

      childPropertyOrderRef.current = (childPropertyOrderRef.current || []).filter((key) => key !== childKeyToDelete);
    },
    [getValues, setValue, pathPrefix]
  );

  const handleRenameChildPropertyKey = useCallback(
    (oldChildKey: string, newChildKey: string) => {
      const parentSchema = getValues(pathPrefix) as JSONSchema7;
      if (!parentSchema.properties || !parentSchema.properties[oldChildKey] || oldChildKey === newChildKey) return;
      if (parentSchema.properties[newChildKey]) throw new Error(`Property "${newChildKey}" already exists.`);
      const currentChildProperties = { ...parentSchema.properties };
      const propertyToRename = currentChildProperties[oldChildKey];
      delete currentChildProperties[oldChildKey];
      currentChildProperties[newChildKey] = propertyToRename;
      setValue(`${pathPrefix}.properties`, currentChildProperties, { shouldValidate: true, shouldDirty: true });

      if (parentSchema.required?.includes(oldChildKey)) {
        setValue(
          `${pathPrefix}.required`,
          parentSchema.required.map((reqKey: string) => (reqKey === oldChildKey ? newChildKey : reqKey)),
          { shouldValidate: true, shouldDirty: true }
        );
      }

      childPropertyOrderRef.current = (childPropertyOrderRef.current || []).map((key) =>
        key === oldChildKey ? newChildKey : key
      );
    },
    [getValues, setValue, pathPrefix]
  );

  const handleAddArrayItemProperty = useCallback(() => {
    const newItemPropertyKey = uuidv4();
    const parentArraySchema = getValues(pathPrefix) as JSONSchema7;
    if (!parentArraySchema || parentArraySchema.type !== 'array') return;
    let itemSchema = (parentArraySchema.items as JSONSchema7) || {};

    if (itemSchema.type !== 'object') {
      itemSchema = ensureObject({ type: 'string' });
      setValue(`${pathPrefix}.items`, itemSchema, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }

    const newItemProp = newProperty('string');
    const newItemProperties = { ...(itemSchema.properties || {}), [newItemPropertyKey]: newItemProp };
    setValue(`${pathPrefix}.items.properties`, newItemProperties, { shouldValidate: true, shouldDirty: true });
    arrayItemPropertyOrderRef.current = [...(arrayItemPropertyOrderRef.current || []), newItemPropertyKey];
  }, [getValues, setValue, pathPrefix]);

  const handleDeleteArrayItemProperty = useCallback(
    (itemPropertyKeyToDelete: string) => {
      const parentArraySchema = getValues(pathPrefix) as JSONSchema7;
      if (
        !parentArraySchema?.items ||
        typeof parentArraySchema.items !== 'object' ||
        !(parentArraySchema.items as JSONSchema7).properties
      )
        return;
      const itemSchema = parentArraySchema.items as JSONSchema7;
      const { [itemPropertyKeyToDelete]: _, ...remainingItemProperties } = itemSchema.properties!;
      setValue(`${pathPrefix}.items.properties`, remainingItemProperties, { shouldValidate: true, shouldDirty: true });

      if (itemSchema.required?.includes(itemPropertyKeyToDelete)) {
        setValue(
          `${pathPrefix}.items.required`,
          itemSchema.required.filter((reqKey: string) => reqKey !== itemPropertyKeyToDelete),
          { shouldValidate: true, shouldDirty: true }
        );
      }

      arrayItemPropertyOrderRef.current = (arrayItemPropertyOrderRef.current || []).filter(
        (key: string) => key !== itemPropertyKeyToDelete
      );
    },
    [getValues, setValue, pathPrefix]
  );

  const handleRenameArrayItemPropertyKey = useCallback(
    (oldItemKey: string, newItemKey: string) => {
      const parentArraySchema = getValues(pathPrefix) as JSONSchema7;
      if (
        !parentArraySchema?.items ||
        typeof parentArraySchema.items !== 'object' ||
        !(parentArraySchema.items as JSONSchema7).properties ||
        !(parentArraySchema.items as JSONSchema7).properties![oldItemKey] ||
        oldItemKey === newItemKey
      )
        return;
      const itemSchema = parentArraySchema.items as JSONSchema7;
      if (itemSchema.properties![newItemKey]) throw new Error(`Property "${newItemKey}" already exists.`);
      const currentItemProperties = { ...itemSchema.properties! };
      const propertyToRename = currentItemProperties[oldItemKey];
      delete currentItemProperties[oldItemKey];
      currentItemProperties[newItemKey] = propertyToRename;
      setValue(`${pathPrefix}.items.properties`, currentItemProperties, { shouldValidate: true, shouldDirty: true });

      if (itemSchema.required?.includes(oldItemKey)) {
        setValue(
          `${pathPrefix}.items.required`,
          itemSchema.required.map((reqKey: string) => (reqKey === oldItemKey ? newItemKey : reqKey)),
          { shouldValidate: true, shouldDirty: true }
        );
      }

      arrayItemPropertyOrderRef.current = (arrayItemPropertyOrderRef.current || []).map((key: string) =>
        key === oldItemKey ? newItemKey : key
      );
    },
    [getValues, setValue, pathPrefix]
  );

  const handleSaveSettings = useCallback(
    (updatedSettings: Partial<JSONSchema7> & { _isNowRequired?: boolean }) => {
      const { _isNowRequired, ...actualSchemaChanges } = updatedSettings;
      const currentSchemaAtPath = getValues(pathPrefix) as JSONSchema7;
      const newSchemaFragment = { ...currentSchemaAtPath, ...actualSchemaChanges };
      Object.keys(newSchemaFragment).forEach((key) => {
        if ((newSchemaFragment as any)[key] === undefined) delete (newSchemaFragment as any)[key];
      });
      setValue(pathPrefix, newSchemaFragment, { shouldValidate: true, shouldDirty: true });

      if (_isNowRequired !== undefined) {
        let parentSchemaPath = '';
        if (pathPrefix.includes('.properties.'))
          parentSchemaPath = pathPrefix.substring(0, pathPrefix.lastIndexOf('.properties.'));
        else if (pathPrefix.includes('.items.properties.'))
          parentSchemaPath = pathPrefix.substring(0, pathPrefix.lastIndexOf('.items.properties.')) + '.items';

        if (parentSchemaPath) {
          const parentSchema = getValues(parentSchemaPath) as JSONSchema7 | undefined;

          if (
            parentSchema &&
            (parentSchema.type === 'object' ||
              (parentSchema.type === 'array' && (parentSchema.items as JSONSchema7)?.type === 'object'))
          ) {
            let currentRequired = parentSchema.required || [];

            if (_isNowRequired) {
              if (!currentRequired.includes(propertyKey)) currentRequired = [...currentRequired, propertyKey];
            } else {
              currentRequired = currentRequired.filter((k: string) => k !== propertyKey);
            }

            setValue(`${parentSchemaPath}.required`, currentRequired.length > 0 ? currentRequired : undefined, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }
      }

      setIsSettingsOpen(false);
    },
    [getValues, setValue, pathPrefix, propertyKey]
  );

  if (!currentPropertySchema) return null;

  const orderedChildPropertyKeys = [
    ...(childPropertyOrderRef.current || []).filter((key) => currentPropertySchema.properties?.[key] !== undefined),
    ...Object.keys(currentPropertySchema.properties || {}).filter(
      (key) => !(childPropertyOrderRef.current || []).includes(key)
    ),
  ];

  const arrayItemSchemaObject = currentPropertySchema.items as JSONSchema7 | undefined;
  const orderedArrayItemPropertyKeys = [
    ...(arrayItemPropertyOrderRef.current || []).filter(
      (key) => arrayItemSchemaObject?.properties?.[key] !== undefined
    ),
    ...Object.keys(arrayItemSchemaObject?.properties || {}).filter(
      (key) => !(arrayItemPropertyOrderRef.current || []).includes(key)
    ),
  ];

  return (
    <>
      <div className={cn('flex flex-col')}>
        <div className={cn('flex items-center space-x-2 py-0.5', getMarginClassPx(indentationLevel))}>
          <div className="flex-1 flex-col">
            <div className="relative">
              <TooltipProvider delayDuration={0}>
                <InputRoot hasError={!!nameError} size="2xs" className="font-mono">
                  <InputWrapper>
                    <Code2 className="h-4 w-4 shrink-0 text-gray-500" />
                    <InputPure
                      value={localName}
                      onChange={(e) => {
                        setLocalName(e.target.value);
                        if (nameError && nameError === 'Property name cannot be empty.') setNameError(null);
                      }}
                      onBlur={() => handleNameChange(localName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNameChange(localName);
                        }

                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setLocalName(propertyKey);
                          setNameError(null);
                        }
                      }}
                      placeholder="Property name"
                      className="text-xs"
                    />
                    {nameError && (
                      <Tooltip open>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-default items-center justify-center">
                            <RiErrorWarningLine className="text-destructive h-4 w-4 shrink-0" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={5}>
                          <p>{nameError}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </InputWrapper>
                </InputRoot>
              </TooltipProvider>
            </div>
          </div>
          <Controller
            name={`${pathPrefix}.type`}
            control={control}
            render={({ field: { onChange, value: RHFTypeValue, ...fieldRest } }) => {
              return (
                <Select
                  value={currentType as string | undefined}
                  onValueChange={(newTypeValue) => handleTypeChange(newTypeValue as JSONSchema7TypeName | 'enum')}
                >
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
              );
            }}
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
            {isSettingsOpen && currentPropertySchema && (
              <SchemaPropertySettingsPopover
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                propertySchema={currentPropertySchema}
                propertyKey={propertyKey}
                parentSchema={
                  pathPrefix.includes('.properties.')
                    ? getValues(pathPrefix.substring(0, pathPrefix.lastIndexOf('.properties.')))
                    : pathPrefix.includes('.items.properties.')
                      ? getValues(pathPrefix.substring(0, pathPrefix.lastIndexOf('.items.properties.')) + '.items')
                      : getValues('schema')
                }
                onSave={handleSaveSettings}
                onDelete={onDeleteProperty}
              />
            )}
          </Popover>
          <Button variant="error" mode="outline" size="2xs" leadingIcon={RiDeleteBin6Line} onClick={onDeleteProperty} />
        </div>

        {currentType === 'enum' && enumFieldArrayPath === `${pathPrefix}.enum` && currentPropertySchema?.enum && (
          <div className={cn('flex flex-col space-y-1 pt-1', getMarginClassPx(indentationLevel + 1))}>
            {(enumFields || []).map((field, enumIndex) => {
              const enumValuePath = `${pathPrefix}.enum.${enumIndex}` as const;
              return (
                <div key={field.id} className="flex items-center space-x-2">
                  <Controller
                    name={enumValuePath}
                    control={control}
                    defaultValue={getValues(enumValuePath) || ''}
                    render={({ field: enumValueField, fieldState }) => (
                      <InputRoot hasError={!!fieldState.error} size="2xs" className="flex-1">
                        <InputPure
                          {...enumValueField}
                          placeholder={`Choice ${enumIndex + 1}`}
                          className="pl-2 text-xs"
                        />
                        {fieldState.error && (
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
                name={`${pathPrefix}.items.type`}
                control={control}
                render={({ field }) => (
                  <Select
                    value={currentArrayItemType as string | undefined}
                    onValueChange={(newItemTypeValue) =>
                      handleArrayItemTypeChange(newItemTypeValue as JSONSchema7TypeName)
                    }
                  >
                    <SelectTrigger size="2xs" className="w-[120px] text-sm">
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEMA_TYPE_OPTIONS.filter((opt) => opt.value !== 'enum' && opt.value !== 'array').map(
                        (option) => (
                          <SelectItem key={option.value} value={option.value} className="text-sm">
                            {option.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {currentArrayItemType === 'object' && arrayItemSchemaObject?.properties !== undefined && (
              <div className={cn('flex flex-col space-y-1 pt-1')}>
                {orderedArrayItemPropertyKeys.map((itemPropertyKey) => {
                  const itemPropertySchema = arrayItemSchemaObject?.properties?.[itemPropertyKey];
                  if (typeof itemPropertySchema !== 'object' || itemPropertySchema === null) return null;
                  return (
                    <SchemaPropertyRow
                      key={itemPropertyKey}
                      control={control}
                      propertyKey={itemPropertyKey}
                      pathPrefix={`${pathPrefix}.items.properties.${itemPropertyKey}`}
                      onDeleteProperty={() => handleDeleteArrayItemProperty(itemPropertyKey)}
                      onRenamePropertyKey={handleRenameArrayItemPropertyKey}
                      indentationLevel={indentationLevel + 1}
                    />
                  );
                })}
                <div>
                  <Button
                    variant="secondary"
                    mode="lighter"
                    size="2xs"
                    className={cn('mt-1', getMarginClassPx(indentationLevel + 1))}
                    leadingIcon={RiAddLine}
                    onClick={handleAddArrayItemProperty}
                  >
                    Add property to item
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentType === 'object' && currentPropertySchema.properties !== undefined && (
          <div className={cn('flex flex-col space-y-1 pt-1')}>
            {orderedChildPropertyKeys.map((childKey) => {
              const childPropertySchema = currentPropertySchema.properties?.[childKey];
              if (typeof childPropertySchema !== 'object' || childPropertySchema === null) return null;
              return (
                <SchemaPropertyRow
                  key={childKey}
                  control={control}
                  propertyKey={childKey}
                  pathPrefix={`${pathPrefix}.properties.${childKey}`}
                  onDeleteProperty={() => handleDeleteChildProperty(childKey)}
                  onRenamePropertyKey={handleRenameChildPropertyKey}
                  indentationLevel={indentationLevel + 1}
                />
              );
            })}
            <div className={cn(getMarginClassPx(indentationLevel + 1))}>
              <Button
                variant="secondary"
                mode="lighter"
                size="2xs"
                className="mt-1"
                leadingIcon={RiAddLine}
                onClick={handleAddChildProperty}
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
