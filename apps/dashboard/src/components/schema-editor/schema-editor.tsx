import { useState, useCallback } from 'react';
// import { nanoid } from 'nanoid'; // For generating unique IDs - Replaced with crypto.randomUUID
import { RiAddLine } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import type { SchemaProperty, SchemaValueType } from './types';
import { SchemaPropertyRow } from './schema-property-row';
import { DEFAULT_PROPERTY_NAME } from './constants'; // Removed SCHEMA_TYPE_OPTIONS as it's not used here

interface SchemaEditorProps {
  initialSchema?: SchemaProperty[];
  onChange?: (schema: SchemaProperty[]) => void;
  // TODO: Add readOnly prop if needed
}

const createNewProperty = (name?: string): SchemaProperty => ({
  id: crypto.randomUUID(),
  name: name || DEFAULT_PROPERTY_NAME,
  type: 'string' as SchemaValueType,
  enumValues: [],
  children: [],
  arrayItemType: 'string' as SchemaValueType,
  arrayItemSchema: [],
});

// Helper function to recursively find and update/delete properties
const findAndUpdateRecursive = (
  properties: SchemaProperty[],
  targetId: string,
  action: 'update' | 'delete' | 'addChild' | 'addArrayItemChild',
  updates?: Partial<SchemaProperty>
): SchemaProperty[] => {
  return properties
    .map((prop) => {
      if (prop.id === targetId) {
        if (action === 'update' && updates) {
          return { ...prop, ...updates };
        }

        if (action === 'addChild') {
          const newChild = createNewProperty();
          return { ...prop, children: [...(prop.children || []), newChild] };
        }

        if (action === 'addArrayItemChild') {
          const newArrayItemProp = createNewProperty();
          return {
            ...prop,
            arrayItemSchema: [...(prop.arrayItemSchema || []), newArrayItemProp],
          };
        }

        if (action === 'delete') {
          return null;
        }
      }

      if (prop.children && prop.children.length > 0) {
        const updatedChildren = findAndUpdateRecursive(prop.children, targetId, action, updates);

        if (
          updatedChildren.length !== prop.children.length ||
          updatedChildren.some((uc, i) => uc !== prop.children![i])
        ) {
          return { ...prop, children: updatedChildren.filter(Boolean) as SchemaProperty[] };
        }
      }

      if (prop.arrayItemSchema && prop.arrayItemSchema.length > 0 && action !== 'addArrayItemChild') {
        const updatedArrayItemSchema = findAndUpdateRecursive(prop.arrayItemSchema, targetId, action, updates);

        if (
          updatedArrayItemSchema.length !== prop.arrayItemSchema.length ||
          updatedArrayItemSchema.some((uc, i) => uc !== prop.arrayItemSchema![i])
        ) {
          return { ...prop, arrayItemSchema: updatedArrayItemSchema.filter(Boolean) as SchemaProperty[] };
        }
      }

      return prop;
    })
    .filter(Boolean) as SchemaProperty[];
};

export function SchemaEditor({ initialSchema, onChange }: SchemaEditorProps) {
  const [properties, setProperties] = useState<SchemaProperty[]>(() => {
    if (initialSchema && initialSchema.length > 0) {
      return initialSchema;
    }

    return [createNewProperty()];
  });

  const updateAndNotify = useCallback(
    (updatedProps: SchemaProperty[]) => {
      setProperties(updatedProps);
      onChange?.(updatedProps);
    },
    [onChange]
  );

  const handleAddProperty = useCallback(() => {
    const newProp = createNewProperty();
    updateAndNotify([...properties, newProp]);
  }, [properties, updateAndNotify]);

  const handleUpdateProperty = useCallback(
    (id: string, updates: Partial<SchemaProperty>) => {
      const updated = findAndUpdateRecursive(properties, id, 'update', updates);
      updateAndNotify(updated);
    },
    [properties, updateAndNotify]
  );

  const handleDeleteProperty = useCallback(
    (id: string) => {
      const updated = findAndUpdateRecursive(properties, id, 'delete');
      updateAndNotify(updated);
    },
    [properties, updateAndNotify]
  );

  const handleAddNestedProperty = useCallback(
    (parentId: string) => {
      const updated = findAndUpdateRecursive(properties, parentId, 'addChild');
      updateAndNotify(updated);
    },
    [properties, updateAndNotify]
  );

  const handleAddArrayItemProperty = useCallback(
    (arrayPropertyId: string) => {
      const updated = findAndUpdateRecursive(properties, arrayPropertyId, 'addArrayItemChild');
      updateAndNotify(updated);
    },
    [properties, updateAndNotify]
  );

  const handleAddEnumChoice = useCallback(
    (propertyId: string) => {
      const propToUpdate = findAndUpdateRecursive(properties, propertyId, 'update', {});
      const enumValues = propToUpdate.find((p) => p.id === propertyId)?.enumValues || [];
      const updated = findAndUpdateRecursive(properties, propertyId, 'update', {
        enumValues: [...enumValues, ''],
      });
      updateAndNotify(updated);
    },
    [properties, updateAndNotify]
  );

  const handleUpdateEnumChoice = useCallback(
    (propertyId: string, choiceIndex: number, value: string) => {
      const propToUpdate = findAndUpdateRecursive(properties, propertyId, 'update', {}).find(
        (p) => p.id === propertyId
      );

      if (propToUpdate && propToUpdate.enumValues) {
        const newEnumValues = [...propToUpdate.enumValues];
        newEnumValues[choiceIndex] = value;
        const updated = findAndUpdateRecursive(properties, propertyId, 'update', { enumValues: newEnumValues });
        updateAndNotify(updated);
      }
    },
    [properties, updateAndNotify]
  );

  const handleDeleteEnumChoice = useCallback(
    (propertyId: string, choiceIndex: number) => {
      const propToUpdate = findAndUpdateRecursive(properties, propertyId, 'update', {}).find(
        (p) => p.id === propertyId
      );

      if (propToUpdate && propToUpdate.enumValues) {
        const newEnumValues = propToUpdate.enumValues.filter((_, index) => index !== choiceIndex);
        const updated = findAndUpdateRecursive(properties, propertyId, 'update', { enumValues: newEnumValues });
        updateAndNotify(updated);
      }
    },
    [properties, updateAndNotify]
  );

  return (
    <div className="space-y-2">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Payload schema</h3>
        {/* Placeholder for Import/Export button */}
        {/* <Button variant="secondary" mode="outline" size="sm">Import / Export</Button> */}
      </div>
      {properties.map((property) => (
        <SchemaPropertyRow
          key={property.id}
          property={property}
          onUpdateProperty={handleUpdateProperty}
          onDeleteProperty={handleDeleteProperty}
          onAddEnumChoice={handleAddEnumChoice}
          onUpdateEnumChoice={handleUpdateEnumChoice}
          onDeleteEnumChoice={handleDeleteEnumChoice}
          onAddNestedProperty={handleAddNestedProperty}
          onAddArrayItemProperty={handleAddArrayItemProperty}
          indentationLevel={0}
        />
      ))}
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
  );
}
