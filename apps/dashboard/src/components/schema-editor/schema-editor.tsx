import { useCallback, useEffect } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { useForm, useFieldArray, FormProvider, type Control, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/primitives/button';
import type { SchemaProperty } from './types';
import { SchemaPropertyRow } from './schema-property-row';
import { createNewProperty } from './utils/property-helpers';
import { editorSchema } from './utils/validation-schema';

interface SchemaEditorProps {
  initialSchema?: SchemaProperty[];
  onChange?: (schema: SchemaProperty[]) => void;
}

interface FormValues {
  schemaRows: SchemaProperty[];
}

export function SchemaEditor({ initialSchema, onChange }: SchemaEditorProps) {
  const methods = useForm<FormValues>({
    defaultValues: {
      schemaRows: initialSchema && initialSchema.length > 0 ? initialSchema : [createNewProperty()],
    },
    resolver: zodResolver(editorSchema),
    mode: 'onChange',
  });
  const {
    control,
    watch,
    formState: { errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schemaRows',
    keyName: 'rhfId',
  });

  useEffect(() => {
    const subscription = watch((value) => {
      if (onChange && value.schemaRows) {
        onChange(value.schemaRows as SchemaProperty[]);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  const handleAddProperty = useCallback(() => {
    append(createNewProperty());
  }, [append]);

  const handleDeleteProperty = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  const handleAddNestedProperty = useCallback((parentPropertyPath: string) => {
    console.log('handleAddNestedProperty for:', parentPropertyPath);
  }, []);
  const handleAddArrayItemProperty = useCallback((arrayPropertyPath: string) => {
    console.log('handleAddArrayItemProperty for:', arrayPropertyPath);
  }, []);
  const handleAddEnumChoice = useCallback((propertyIndex: number) => {
    console.log('handleAddEnumChoice for property index:', propertyIndex);
  }, []);
  const handleUpdateEnumChoice = useCallback((propertyIndex: number, choiceIndex: number, value: string) => {
    console.log('handleUpdateEnumChoice for:', propertyIndex, choiceIndex, value);
  }, []);
  const handleDeleteEnumChoice = useCallback((propertyIndex: number, choiceIndex: number) => {
    console.log('handleDeleteEnumChoice for:', propertyIndex, choiceIndex);
  }, []);

  return (
    <FormProvider {...methods}>
      <div className="space-y-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Payload schema</h3>
        </div>
        {fields.map((field, index) => {
          const pathPrefix = `schemaRows.${index}`;
          return (
            <SchemaPropertyRow
              key={field.rhfId}
              control={control as unknown as Control<FieldValues>}
              property={field as any}
              index={index}
              pathPrefix={pathPrefix}
              onDeleteProperty={() => handleDeleteProperty(index)}
              onAddEnumChoice={() => handleAddEnumChoice(index)}
              onUpdateEnumChoice={(choiceIndex, value) => handleUpdateEnumChoice(index, choiceIndex, value)}
              onDeleteEnumChoice={(choiceIndex) => handleDeleteEnumChoice(index, choiceIndex)}
              onAddNestedProperty={() => handleAddNestedProperty(pathPrefix)}
              onAddArrayItemProperty={() => handleAddArrayItemProperty(pathPrefix)}
              indentationLevel={0}
            />
          );
        })}
        <Button
          variant="secondary"
          mode="outline"
          size="sm"
          onClick={handleAddProperty}
          className="mt-2 w-full"
          leadingIcon={RiAddLine}
        >
          Add property
        </Button>
      </div>
    </FormProvider>
  );
}
