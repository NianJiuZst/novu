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
import { getMarginClassPx } from './utils/ui-helpers';

// Import new sub-components
import { PropertyNameInput } from './components/property-name-input';
import { PropertyTypeSelector } from './components/property-type-selector';
import { PropertyActions } from './components/property-actions';
import { EnumFieldsRenderer } from './components/enum-fields-renderer';
import { ArrayItemSchemaRenderer } from './components/array-item-schema-renderer';
import { ObjectPropertiesRenderer } from './components/object-properties-renderer';

export interface SchemaPropertyRowProps {
  control: Control<any>;
  propertyKey: string;
  pathPrefix: string;
  onDeleteProperty: () => void;
  onRenamePropertyKey: (oldKey: string, newKey: string) => void | Error;
  indentationLevel?: number;
}

export function SchemaPropertyRow(props: SchemaPropertyRowProps) {
  const {
    control: mainFormControl,
    propertyKey,
    pathPrefix,
    onDeleteProperty: onDeleteThisProperty,
    onRenamePropertyKey: onRenameThisPropertyKey,
    indentationLevel = 0,
  } = props;

  const { setValue, getValues } = useFormContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentPropertySchema = useWatch({ control: mainFormControl, name: pathPrefix }) as JSONSchema7 | undefined;

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
    control: mainFormControl,
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
          <PropertyNameInput
            propertyKey={propertyKey}
            pathPrefix={pathPrefix}
            onAttemptRename={onRenameThisPropertyKey}
            control={mainFormControl}
          />
          <PropertyTypeSelector
            currentType={currentType}
            pathPrefix={pathPrefix}
            control={mainFormControl}
            setValue={setValue}
            getValues={getValues}
          />
          <PropertyActions
            pathPrefix={pathPrefix}
            propertyKey={propertyKey}
            currentPropertySchema={currentPropertySchema}
            getValues={getValues}
            setValue={setValue}
            onDeleteProperty={onDeleteThisProperty}
          />
        </div>

        {currentType === 'enum' && enumFieldArrayPath === `${pathPrefix}.enum` && currentPropertySchema?.enum && (
          <div className={cn('flex flex-col space-y-1 pt-1', getMarginClassPx(indentationLevel + 1))}>
            {(enumFields || []).map((field, enumIndex) => {
              const enumValuePath = `${pathPrefix}.enum.${enumIndex}` as const;
              return (
                <div key={field.id} className="flex items-center space-x-2">
                  <Controller
                    name={enumValuePath}
                    control={mainFormControl}
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
          <ArrayItemSchemaRenderer
            pathPrefix={pathPrefix}
            currentPropertySchema={currentPropertySchema}
            control={mainFormControl}
            setValue={setValue}
            getValues={getValues}
            indentationLevel={indentationLevel}
            arrayItemPropertyOrderRef={arrayItemPropertyOrderRef}
            onDeleteProperty={handleDeleteArrayItemProperty}
            onRenamePropertyKey={handleRenameArrayItemPropertyKey}
            RenderPropertyRowComponent={SchemaPropertyRow}
          />
        )}

        {currentType === 'object' && currentPropertySchema.properties !== undefined && (
          <ObjectPropertiesRenderer
            pathPrefix={pathPrefix}
            currentPropertySchema={currentPropertySchema}
            control={mainFormControl}
            setValue={setValue}
            getValues={getValues}
            indentationLevel={indentationLevel}
            childPropertyOrderRef={childPropertyOrderRef}
            onDeleteProperty={handleDeleteChildProperty}
            onRenamePropertyKey={handleRenameChildPropertyKey}
            RenderPropertyRowComponent={SchemaPropertyRow}
          />
        )}
      </div>
    </>
  );
}
