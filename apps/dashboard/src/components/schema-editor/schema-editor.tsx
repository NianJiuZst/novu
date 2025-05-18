import { useCallback, useEffect, useRef } from 'react';
import { useForm, FormProvider, useFieldArray, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { RiAddLine } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import type { JSONSchema7 } from './json-schema';
import { SchemaPropertyRow } from './schema-property-row';
import { newProperty } from './utils/json-helpers';
import { editorSchema, type SchemaEditorFormValues, type PropertyListItem } from './utils/validation-schema';

interface SchemaEditorProps {
  initialSchema?: JSONSchema7;
  onChange?: (schema: JSONSchema7) => void;
  onValidityChange?: (isValid: boolean) => void;
  highlightPath?: string;
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

export function SchemaEditor({ initialSchema, onChange, onValidityChange, highlightPath }: SchemaEditorProps) {
  const initialTransformedValuesRef = useRef<SchemaEditorFormValues>({
    propertyList: initialSchema?.properties
      ? convertSchemaToPropertyList(initialSchema.properties, initialSchema.required)
      : defaultFormValues.propertyList,
  });

  const methods = useForm<SchemaEditorFormValues>({
    defaultValues: initialTransformedValuesRef.current,
    resolver: zodResolver(editorSchema),
    mode: 'onChange',
  });

  const { control, watch, formState, getValues, reset } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'propertyList',
    keyName: 'fieldId',
  });

  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(formState.isValid);
    }
  }, [formState.isValid, onValidityChange]);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    const subscription = watch((value) => {
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
        }
      }, 300);
    });

    return () => {
      clearTimeout(debounceTimer);
      subscription.unsubscribe();
    };
  }, [watch, onChange]);

  useEffect(() => {
    const newPropertyList = initialSchema?.properties
      ? convertSchemaToPropertyList(initialSchema.properties, initialSchema.required)
      : defaultFormValues.propertyList;

    reset({ propertyList: newPropertyList });
  }, [initialSchema, reset]);

  const handleAddProperty = useCallback(() => {
    append({
      id: uuidv4(),
      keyName: '',
      definition: newProperty('string'),
      isRequired: false,
    } as PropertyListItem);
  }, [append]);

  return (
    <FormProvider {...methods}>
      <div className="rounded-4 bg-bg-white border border-neutral-100 p-2">
        {fields.map((field, index) => (
          <SchemaPropertyRow
            key={field.fieldId}
            control={control}
            index={index}
            pathPrefix={`propertyList.${index}`}
            onDeleteProperty={() => remove(index)}
            indentationLevel={0}
            highlightPath={highlightPath}
            currentDataPath=""
          />
        ))}
        <Button
          variant="secondary"
          mode="lighter"
          size="2xs"
          onClick={handleAddProperty}
          className="mt-2"
          leadingIcon={RiAddLine}
          disabled={!formState.isValid && fields.length > 0}
        >
          Add property
        </Button>
      </div>
    </FormProvider>
  );
}
