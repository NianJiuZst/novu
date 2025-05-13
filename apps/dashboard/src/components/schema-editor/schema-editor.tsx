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
    // formState: { errors }, // errors can be used for top-level form errors if needed
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schemaRows',
    keyName: 'rhfId', // react-hook-form uses 'id' by default, ensure this was intended
  });

  useEffect(() => {
    const subscription = watch((value) => {
      if (onChange && value.schemaRows) {
        // TODO: ensure value.schemaRows is deeply cloned or handled if mutations are a concern downstream
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

  return (
    <FormProvider {...methods}>
      <div className="rounded-4 bg-bg-white border border-neutral-100 p-2">
        {fields.map((field, index) => {
          const pathPrefix = `schemaRows.${index}`;
          // Cast field to any for now to avoid excessive type errors during refactor
          // Will be properly typed once SchemaProperty aligns with RHF field structure
          return (
            <SchemaPropertyRow
              key={field.rhfId}
              control={control as unknown as Control<FieldValues>} // Proper control typing
              property={field as any} // Temporarily 'any', should align with Zod schema later
              index={index}
              pathPrefix={pathPrefix}
              onDeleteProperty={() => handleDeleteProperty(index)}
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
