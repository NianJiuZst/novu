import { useCallback, useMemo, type ComponentType } from 'react';
import type { Control, UseFormGetValues, UseFormSetValue, FieldValues } from 'react-hook-form';
import { RiAddLine } from 'react-icons/ri';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/primitives/button';
import { cn } from '@/utils/ui';
import type { JSONSchema7 } from '../json-schema';
import { getMarginClassPx } from '../utils/ui-helpers';
import { newProperty } from '../utils/json-helpers';
// Remove direct import of SchemaPropertyRow
// import { SchemaPropertyRow } from '../schema-property-row';
import type { SchemaPropertyRowProps } from '../schema-property-row'; // Import the type

type ObjectPropertiesRendererProps = {
  pathPrefix: string;
  currentPropertySchema: JSONSchema7;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  indentationLevel: number;
  childPropertyOrderRef: React.MutableRefObject<string[]>;
  onRenamePropertyKey: (oldKey: string, newKey: string, parentPath: string) => void | Error;
  onDeleteProperty: (propertyKey: string, parentPath: string) => void;
  RenderPropertyRowComponent: ComponentType<SchemaPropertyRowProps>; // Prop for recursive rendering
  isDisabled?: boolean;
};

export function ObjectPropertiesRenderer({
  pathPrefix,
  currentPropertySchema,
  control,
  setValue,
  getValues,
  indentationLevel,
  childPropertyOrderRef,
  onRenamePropertyKey,
  onDeleteProperty,
  RenderPropertyRowComponent, // Use this prop
  isDisabled = false,
}: ObjectPropertiesRendererProps) {
  const propertiesPath = `${pathPrefix}.properties`;

  const handleAddChildProperty = useCallback(() => {
    const childKey = uuidv4();
    const currentObjectSchema = getValues(pathPrefix) as JSONSchema7;
    const newChildProp = newProperty('string');
    const newChildProperties = { ...(currentObjectSchema.properties || {}), [childKey]: newChildProp };
    setValue(propertiesPath, newChildProperties, { shouldValidate: true, shouldDirty: true });
    childPropertyOrderRef.current = [...(childPropertyOrderRef.current || []), childKey];
  }, [getValues, setValue, pathPrefix, propertiesPath, childPropertyOrderRef]);

  const handleDeleteChildProperty = useCallback(
    (childKeyToDelete: string) => {
      onDeleteProperty(childKeyToDelete, pathPrefix);
    },
    [onDeleteProperty, pathPrefix]
  );

  const handleRenameChildPropertyKey = useCallback(
    (oldChildKey: string, newChildKey: string) => {
      onRenamePropertyKey(oldChildKey, newChildKey, pathPrefix);
    },
    [onRenamePropertyKey, pathPrefix]
  );

  const orderedChildPropertyKeys = useMemo(
    () => [
      ...(childPropertyOrderRef.current || []).filter((key) => currentPropertySchema.properties?.[key] !== undefined),
      ...Object.keys(currentPropertySchema.properties || {}).filter(
        (key) => !(childPropertyOrderRef.current || []).includes(key)
      ),
    ],
    [childPropertyOrderRef, currentPropertySchema.properties]
  );

  if (currentPropertySchema.type !== 'object') {
    return null;
  }

  return (
    <div className={cn('flex flex-col space-y-1 pt-1')}>
      {currentPropertySchema.properties &&
        orderedChildPropertyKeys.map((childKey) => {
          const childPropertySchema = currentPropertySchema.properties?.[childKey];
          if (typeof childPropertySchema !== 'object' || childPropertySchema === null) return null;

          return (
            <RenderPropertyRowComponent // Use the passed component
              key={childKey}
              control={control as Control<FieldValues>}
              propertyKey={childKey}
              pathPrefix={`${propertiesPath}.${childKey}`}
              onDeleteProperty={() => handleDeleteChildProperty(childKey)}
              onRenamePropertyKey={(oldKey: string, newKey: string) => handleRenameChildPropertyKey(oldKey, newKey)} // Add types
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
          disabled={isDisabled}
        >
          Add nested property
        </Button>
      </div>
    </div>
  );
}
