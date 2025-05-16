import { useCallback, useMemo, type ComponentType } from 'react';
import type { Control, UseFormGetValues, UseFormSetValue, FieldValues } from 'react-hook-form';
import { RiAddLine } from 'react-icons/ri';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/primitives/button';
import { cn } from '@/utils/ui';
import type { JSONSchema7, JSONSchema7TypeName } from '../json-schema';
import { getMarginClassPx } from '../utils/ui-helpers';
import { ensureObject, newProperty } from '../utils/json-helpers';
import { PropertyTypeSelector } from './property-type-selector';
import type { SchemaPropertyRowProps } from '../schema-property-row';

type ArrayItemSchemaRendererProps = {
  pathPrefix: string; // Path to the parent array property, e.g., "schema.myArray"
  currentPropertySchema: JSONSchema7; // The schema of the parent array property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>;
  indentationLevel: number;
  arrayItemPropertyOrderRef: React.MutableRefObject<string[]>;
  onRenamePropertyKey: (oldKey: string, newKey: string, parentPath: string) => void | Error;
  onDeleteProperty: (propertyKey: string, parentPath: string) => void;
  RenderPropertyRowComponent: ComponentType<SchemaPropertyRowProps>; // Prop for recursive rendering
  isDisabled?: boolean;
};

export function ArrayItemSchemaRenderer({
  pathPrefix,
  currentPropertySchema,
  control,
  setValue,
  getValues,
  indentationLevel,
  arrayItemPropertyOrderRef,
  onRenamePropertyKey,
  onDeleteProperty,
  RenderPropertyRowComponent, // Use this prop
  isDisabled = false,
}: ArrayItemSchemaRendererProps) {
  const itemSchemaPath = `${pathPrefix}.items`;

  const currentArrayItemType = useMemo(() => {
    if (currentPropertySchema.type !== 'array') return undefined;
    const itemSchema = currentPropertySchema.items as JSONSchema7 | undefined;
    if (!itemSchema) return undefined;
    if (itemSchema.enum) return 'enum'; // Though we filter out enum as item type
    if (itemSchema.properties && !itemSchema.type) return 'object';

    return itemSchema.type as JSONSchema7TypeName | 'enum' | undefined;
  }, [currentPropertySchema]);

  const handleAddArrayItemProperty = useCallback(() => {
    const newItemPropertyKey = uuidv4();
    let currentItemSchema = getValues(itemSchemaPath) as JSONSchema7 | undefined;

    if (!currentItemSchema || currentItemSchema.type !== 'object') {
      currentItemSchema = ensureObject({ type: 'string' }); // Default to string if converting to object
      setValue(
        itemSchemaPath,
        { ...currentItemSchema, properties: {} },
        { shouldValidate: true, shouldDirty: true, shouldTouch: true }
      );
    }

    const newItemProp = newProperty('string');
    const newItemProperties = { ...(currentItemSchema?.properties || {}), [newItemPropertyKey]: newItemProp };
    setValue(`${itemSchemaPath}.properties`, newItemProperties, { shouldValidate: true, shouldDirty: true });
    arrayItemPropertyOrderRef.current = [...(arrayItemPropertyOrderRef.current || []), newItemPropertyKey];
  }, [getValues, setValue, itemSchemaPath, arrayItemPropertyOrderRef]);

  const handleDeleteArrayItemProperty = useCallback(
    (itemPropertyKeyToDelete: string) => {
      onDeleteProperty(itemPropertyKeyToDelete, itemSchemaPath);
    },
    [onDeleteProperty, itemSchemaPath]
  );

  const handleRenameArrayItemPropertyKey = useCallback(
    (oldItemKey: string, newItemKey: string) => {
      onRenamePropertyKey(oldItemKey, newItemKey, itemSchemaPath);
    },
    [onRenamePropertyKey, itemSchemaPath]
  );

  const arrayItemSchemaObject = currentPropertySchema.items as JSONSchema7 | undefined;
  const orderedArrayItemPropertyKeys = useMemo(
    () => [
      ...(arrayItemPropertyOrderRef.current || []).filter(
        (key) => arrayItemSchemaObject?.properties?.[key] !== undefined
      ),
      ...Object.keys(arrayItemSchemaObject?.properties || {}).filter(
        (key) => !(arrayItemPropertyOrderRef.current || []).includes(key)
      ),
    ],
    [arrayItemPropertyOrderRef, arrayItemSchemaObject?.properties]
  );

  if (currentPropertySchema.type !== 'array') {
    return null;
  }

  return (
    <div className={cn('flex flex-col space-y-1 pt-1')}>
      <div className={cn('flex items-center space-x-2', getMarginClassPx(indentationLevel + 1))}>
        <span className="text-sm text-gray-500">items</span>
        <PropertyTypeSelector
          currentType={currentArrayItemType}
          pathPrefix={pathPrefix} // Pass the parent array path for item type change
          control={control}
          setValue={setValue}
          getValues={getValues}
          isDisabled={isDisabled}
          isItemType // Crucial: indicates this selector is for an array's item type
        />
      </div>

      {currentArrayItemType === 'object' && arrayItemSchemaObject?.properties !== undefined && (
        <div className={cn('flex flex-col space-y-1 pt-1')}>
          {orderedArrayItemPropertyKeys.map((itemPropertyKey) => {
            const itemPropertySchema = arrayItemSchemaObject?.properties?.[itemPropertyKey];
            if (typeof itemPropertySchema !== 'object' || itemPropertySchema === null) return null;

            return (
              <RenderPropertyRowComponent
                key={itemPropertyKey}
                control={control as Control<FieldValues>}
                propertyKey={itemPropertyKey}
                pathPrefix={`${itemSchemaPath}.properties.${itemPropertyKey}`}
                onDeleteProperty={() => handleDeleteArrayItemProperty(itemPropertyKey)}
                onRenamePropertyKey={(oldKey: string, newKey: string) =>
                  handleRenameArrayItemPropertyKey(oldKey, newKey)
                }
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
              disabled={isDisabled}
            >
              Add property to item
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
