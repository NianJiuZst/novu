import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm, FormProvider, useFieldArray, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { RiAddLine, RiAlertLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import type { JSONSchema7 } from './json-schema';
import { SchemaPropertyRow } from './schema-property-row';
import { newProperty } from './utils/json-helpers';
import { editorSchema, type SchemaEditorFormValues, type PropertyListItem } from './utils/validation-schema';
import { usePayloadSchema } from '@/context/payload-schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';

interface SchemaEditorProps {
  initialSchema?: JSONSchema7;
  onChange?: (schema: JSONSchema7) => void;
  onValidityChange?: (isValid: boolean) => void;
}

function convertSchemaToPropertyList(
  schemaProperties?: JSONSchema7['properties'],
  requiredArray?: string[]
): PropertyListItem[] {
  if (!schemaProperties) {
    return [];
  }

  return Object.entries(schemaProperties).map(([key, value]) => {
    const definition = value as JSONSchema7;
    let nestedPropertyList: PropertyListItem[] | undefined = undefined;
    const definitionForListItem: JSONSchema7 = { ...definition };

    if (definition.type === 'object' && definition.properties) {
      nestedPropertyList = convertSchemaToPropertyList(definition.properties, definition.required);
      delete definitionForListItem.properties;
    }

    return {
      id: uuidv4(),
      keyName: key,
      definition: {
        ...definitionForListItem,
        ...(nestedPropertyList ? { propertyList: nestedPropertyList } : {}),
      },
      isRequired: requiredArray?.includes(key) || false,
    };
  });
}

function convertPropertyListToSchema(propertyList?: PropertyListItem[]): {
  properties: JSONSchema7['properties'];
  required?: string[];
} {
  if (!propertyList || propertyList.length === 0) {
    return { properties: {} };
  }

  const properties: JSONSchema7['properties'] = {};
  const required: string[] = [];

  propertyList.forEach((item) => {
    if (item.keyName.trim() !== '') {
      const currentDefinition = { ...item.definition };
      let nestedRequired: string[] | undefined;

      const definitionAsObjectWithList = currentDefinition as JSONSchema7 & { propertyList?: PropertyListItem[] };

      if (
        definitionAsObjectWithList.type === 'object' &&
        definitionAsObjectWithList.propertyList &&
        definitionAsObjectWithList.propertyList.length > 0
      ) {
        const nestedConversion = convertPropertyListToSchema(definitionAsObjectWithList.propertyList);
        currentDefinition.properties = nestedConversion.properties;
        nestedRequired = nestedConversion.required;
      } else if (currentDefinition.type === 'object' && !currentDefinition.properties) {
        currentDefinition.properties = {};
      }

      if (nestedRequired && nestedRequired.length > 0) {
        currentDefinition.required = nestedRequired;
      } else {
        delete currentDefinition.required;
      }

      delete (currentDefinition as any).propertyList;
      properties[item.keyName] = currentDefinition;

      if (item.isRequired) {
        required.push(item.keyName);
      }
    }
  });
  return { properties, ...(required.length > 0 ? { required } : {}) };
}

const defaultFormValues: SchemaEditorFormValues = {
  propertyList: [],
};

export function SchemaEditor({ initialSchema, onChange, onValidityChange }: SchemaEditorProps) {
  const { pendingVariables, removePendingVariable } = usePayloadSchema();
  const pendingVarsArray = useMemo(() => Array.from(pendingVariables), [pendingVariables]);

  const initialTransformedValues: SchemaEditorFormValues = {
    propertyList: initialSchema?.properties
      ? convertSchemaToPropertyList(initialSchema.properties, initialSchema.required)
      : defaultFormValues.propertyList,
  };

  const methods = useForm<SchemaEditorFormValues>({
    defaultValues: initialTransformedValues,
    resolver: zodResolver(editorSchema),
    mode: 'onChange',
  });

  const { control, watch, formState, getValues, setValue } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'propertyList',
    keyName: 'fieldId',
  });

  useEffect(() => {
    if (initialSchema?.properties && pendingVariables.size > 0) {
      Object.keys(initialSchema.properties).forEach((key) => {
        if (pendingVariables.has(key)) {
          removePendingVariable(key);
        }
      });
    }
  }, [initialSchema, pendingVariables, removePendingVariable]);

  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(formState.isValid);
    }
  }, [formState.isValid, onValidityChange]);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    const subscription = watch((value, { name, type }) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (onChange && value.propertyList) {
          const { properties, required } = convertPropertyListToSchema(value.propertyList as PropertyListItem[]);
          const outputSchema: JSONSchema7 = {
            type: 'object',
            properties,
            ...(required && required.length > 0 ? { required } : {}),
          };
          onChange(outputSchema);

          if (name?.endsWith('.keyName') && type === 'change') {
            const changedKey = getValues(name as any);

            if (pendingVariables.has(changedKey)) {
              removePendingVariable(changedKey);
            }
          }
        }
      }, 300);
    });

    return () => {
      clearTimeout(debounceTimer);
      subscription.unsubscribe();
    };
  }, [watch, onChange, pendingVariables, removePendingVariable, getValues]);

  const handleAddProperty = useCallback(() => {
    append({
      id: uuidv4(),
      keyName: '',
      definition: newProperty('string'),
      isRequired: false,
    } as PropertyListItem);
  }, [append]);

  const handleConfirmPendingVariable = useCallback(
    (varName: string) => {
      append({
        id: uuidv4(),
        keyName: varName,
        definition: newProperty('string'),
        isRequired: false,
      } as PropertyListItem);
      removePendingVariable(varName);
    },
    [append, removePendingVariable]
  );

  const handleDismissPendingVariable = useCallback(
    (varName: string) => {
      removePendingVariable(varName);
    },
    [removePendingVariable]
  );

  return (
    <FormProvider {...methods}>
      <div className="rounded-4 bg-bg-white border border-neutral-100 p-2">
        {pendingVarsArray.length > 0 && (
          <div className="mb-4 rounded-md border border-dashed border-blue-500 bg-blue-50 p-2">
            <h3 className="mb-2 flex items-center text-sm font-medium text-blue-700">
              <RiAlertLine className="mr-2 size-4 text-blue-500" /> Suggested Variables
            </h3>
            {pendingVarsArray.map((varName) => (
              <div
                key={varName}
                className="mb-1 flex items-center justify-between gap-2 rounded border border-blue-200 bg-white px-2 py-1.5"
              >
                <span className="font-mono text-sm text-blue-900">{varName}</span>
                <div className="flex items-center gap-1">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          mode="outline"
                          size="2xs"
                          className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleConfirmPendingVariable(varName)}
                        >
                          <RiCheckLine className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={5}>
                        Add to schema
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          mode="outline"
                          size="2xs"
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDismissPendingVariable(varName)}
                        >
                          <RiCloseLine className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={5}>
                        Dismiss suggestion
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}
        {fields.map((field, index) => (
          <SchemaPropertyRow
            key={field.fieldId}
            control={control}
            index={index}
            pathPrefix={`propertyList.${index}`}
            onDeleteProperty={() => remove(index)}
            indentationLevel={0}
          />
        ))}
        <Button
          variant="secondary"
          mode="lighter"
          size="2xs"
          onClick={handleAddProperty}
          className="mt-2"
          leadingIcon={RiAddLine}
          disabled={!formState.isValid && fields.length > 0 && pendingVarsArray.length === 0}
        >
          Add property
        </Button>
      </div>
    </FormProvider>
  );
}
