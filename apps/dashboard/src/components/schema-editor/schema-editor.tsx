import { useCallback, useEffect, useRef } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { useForm, FormProvider, type FieldValues, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/primitives/button';
import type { JSONSchema7 } from './json-schema';
import { SchemaPropertyRow } from './schema-property-row';
import { newProperty } from './utils/json-helpers';
import { editorSchema } from './utils/validation-schema';

interface SchemaEditorProps {
  initialSchema?: JSONSchema7;
  onChange?: (schema: JSONSchema7) => void;
}

interface FormValues {
  schema: JSONSchema7;
}

const defaultSchema: JSONSchema7 = {
  type: 'object',
  properties: {},
};

export function SchemaEditor({ initialSchema, onChange }: SchemaEditorProps) {
  const propertyOrderRef = useRef<string[]>(initialSchema?.properties ? Object.keys(initialSchema.properties) : []);

  const methods = useForm<FormValues>({
    defaultValues: {
      schema: initialSchema && Object.keys(initialSchema).length > 0 ? initialSchema : { ...defaultSchema },
    },
    resolver: zodResolver(editorSchema),
    mode: 'onChange',
  });

  const { control, watch, setValue, getValues } = methods;

  useEffect(() => {
    const processChange = (value: FormValues['schema']) => {
      if (onChange && value) {
        const currentSchema = { ...value }; // clone

        if (currentSchema.properties && propertyOrderRef.current.length > 0) {
          const orderedProperties: Record<string, JSONSchema7> = {};

          for (const key of propertyOrderRef.current) {
            if (currentSchema.properties[key]) {
              orderedProperties[key] = currentSchema.properties[key];
            }
          }

          for (const key in currentSchema.properties) {
            if (
              !Object.prototype.hasOwnProperty.call(orderedProperties, key) &&
              Object.prototype.hasOwnProperty.call(currentSchema.properties, key)
            ) {
              orderedProperties[key] = currentSchema.properties[key];
            }
          }

          currentSchema.properties = orderedProperties;
        }

        onChange(currentSchema);
      }
    };

    let debounceTimer: NodeJS.Timeout;
    const subscription = watch((value, { name, type }) => {
      // console.log('[SchemaEditor] Watch triggered', { name, type, value });
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (value.schema) {
          processChange(value.schema);
        }
      }, 150); // Adjusted debounce time
    });

    return () => {
      clearTimeout(debounceTimer);
      subscription.unsubscribe();
    };
  }, [watch, onChange, getValues, setValue]); // Added getValues, setValue to deps, review if needed

  const handleAddProperty = useCallback(() => {
    const newKey = uuidv4();
    const currentSchema = getValues('schema');
    const newProp = newProperty();
    const newProperties = {
      ...(currentSchema.properties || {}),
      [newKey]: newProp,
    };
    setValue('schema.properties', newProperties, { shouldValidate: true, shouldDirty: true });
    propertyOrderRef.current = [...propertyOrderRef.current, newKey];

    // Manually trigger onChange after adding a property, as watch might not pick up structural changes immediately for debounced onChange
    if (onChange) {
      const updatedFullSchema = getValues('schema');
      onChange(updatedFullSchema);
    }
  }, [getValues, setValue, onChange]);

  const handleDeleteProperty = useCallback(
    (keyToDelete: string) => {
      const currentSchema = getValues('schema');
      if (!currentSchema.properties) return;
      const { [keyToDelete]: _, ...remainingProperties } = currentSchema.properties;
      setValue('schema.properties', remainingProperties, { shouldValidate: true, shouldDirty: true });

      if (currentSchema.required?.includes(keyToDelete)) {
        setValue(
          'schema.required',
          currentSchema.required.filter((reqKey: string) => reqKey !== keyToDelete),
          { shouldValidate: true, shouldDirty: true }
        );
      }

      propertyOrderRef.current = propertyOrderRef.current.filter((key) => key !== keyToDelete);

      if (onChange) {
        onChange(getValues('schema'));
      }
    },
    [getValues, setValue, onChange]
  );

  const handleRenamePropertyKey = useCallback(
    (oldKey: string, newKey: string) => {
      const currentFullSchema = getValues('schema');
      const currentSchemaProperties = currentFullSchema.properties || {};

      if (!currentSchemaProperties[oldKey] || oldKey === newKey) {
        return;
      }

      if (currentSchemaProperties[newKey]) {
        throw new Error(`Property with key "${newKey}" already exists. Please choose a unique name.`);
      }

      const propertiesAfterRename = { ...currentSchemaProperties };
      const propertyToRename = propertiesAfterRename[oldKey];
      delete propertiesAfterRename[oldKey];
      propertiesAfterRename[newKey] = propertyToRename;

      setValue('schema.properties', propertiesAfterRename, { shouldValidate: true, shouldDirty: true });

      propertyOrderRef.current = propertyOrderRef.current.map((key: string) => (key === oldKey ? newKey : key));

      if (currentFullSchema.required?.includes(oldKey)) {
        const newRequired = currentFullSchema.required.map((reqKey: string) => (reqKey === oldKey ? newKey : reqKey));
        setValue('schema.required', newRequired, { shouldValidate: true, shouldDirty: true });
      }

      if (onChange) {
        onChange(getValues('schema'));
      }
    },
    [getValues, setValue, onChange]
  );

  const latestSchema = getValues('schema');
  const latestSchemaProperties = latestSchema?.properties || {};
  const latestPropertyOrder = [...propertyOrderRef.current];

  const orderedPropertyKeys = [
    ...latestPropertyOrder.filter((key) => latestSchemaProperties[key] !== undefined),
    ...Object.keys(latestSchemaProperties).filter((key) => !latestPropertyOrder.includes(key)),
  ];

  return (
    <FormProvider {...methods}>
      <div className="rounded-4 bg-bg-white border border-neutral-100 p-2">
        {orderedPropertyKeys.map((propertyKeyFromMap) => {
          const propertySchemaFragment = latestSchemaProperties[propertyKeyFromMap];

          if (typeof propertySchemaFragment !== 'object' || propertySchemaFragment === null) {
            // This might happen briefly if a key is in orderedPropertyKeys but data is removed before render
            return null;
          }

          return (
            <SchemaPropertyRow
              key={propertyKeyFromMap}
              control={control}
              propertyKey={propertyKeyFromMap}
              pathPrefix={`schema.properties.${propertyKeyFromMap}`}
              onDeleteProperty={() => handleDeleteProperty(propertyKeyFromMap)}
              onRenamePropertyKey={handleRenamePropertyKey}
              indentationLevel={0}
            />
          );
        })}
        <Button
          variant="secondary"
          mode="lighter"
          size="2xs"
          onClick={handleAddProperty}
          className="mt-2"
          leadingIcon={RiAddLine}
        >
          Add property
        </Button>
      </div>
    </FormProvider>
  );
}
