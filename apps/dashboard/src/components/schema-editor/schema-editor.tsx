import { useState, useCallback, useEffect } from 'react';
// import { nanoid } from 'nanoid'; // For generating unique IDs - Replaced with crypto.randomUUID
import { RiAddLine } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import type { SchemaProperty, SchemaValueType } from './types';
import { SchemaPropertyRow } from './schema-property-row';
import { DEFAULT_PROPERTY_NAME } from './constants'; // Removed SCHEMA_TYPE_OPTIONS as it's not used here
// Removed toast imports as we are moving to inline errors for this

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

// This function will now only apply updates, delete, or add children/array items.
// Name uniqueness validation for updates will happen *before* calling this.
const findAndUpdateRecursive = (
  properties: SchemaProperty[],
  targetId: string,
  action: 'update' | 'delete' | 'addChild' | 'addArrayItemChild',
  updates?: Partial<SchemaProperty> // For 'addChild' and 'addArrayItemChild', this can be the new property itself
): SchemaProperty[] => {
  return properties
    .map((prop) => {
      if (prop.id === targetId) {
        if (action === 'update' && updates) {
          return { ...prop, ...updates };
        }

        if (action === 'addChild' && updates) {
          // updates is the new child property
          return { ...prop, children: [...(prop.children || []), updates as SchemaProperty] };
        }

        if (action === 'addArrayItemChild' && updates) {
          // updates is the new array item property
          return { ...prop, arrayItemSchema: [...(prop.arrayItemSchema || []), updates as SchemaProperty] };
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
          return { ...prop, children: updatedChildren };
        }
      }

      if (prop.arrayItemSchema && prop.arrayItemSchema.length > 0) {
        // Ensure not to recurse into arrayItemSchema if the target action is specifically for that array's items from its parent
        if (!(prop.id === targetId && action === 'addArrayItemChild')) {
          const updatedArrayItemSchema = findAndUpdateRecursive(prop.arrayItemSchema, targetId, action, updates);

          if (
            updatedArrayItemSchema.length !== prop.arrayItemSchema.length ||
            updatedArrayItemSchema.some((uc, i) => uc !== prop.arrayItemSchema![i])
          ) {
            return { ...prop, arrayItemSchema: updatedArrayItemSchema };
          }
        }
      }

      return prop;
    })
    .filter(Boolean) as SchemaProperty[];
};

// Checks if a name is unique within a specific list of sibling properties.
function isNameUniqueInScope(name: string, siblings: SchemaProperty[], propertyIdToExclude?: string): boolean {
  return !siblings.some((prop) => prop.id !== propertyIdToExclude && prop.name.toLowerCase() === name.toLowerCase());
}

interface PropertyContext {
  property: SchemaProperty;
  siblings: SchemaProperty[];
  parentId: string | null;
}

// Finds a property and its context (siblings and parentId).
function findPropertyAndContext(
  currentProperties: SchemaProperty[],
  targetId: string,
  currentParentId: string | null = null,
  currentSiblings: SchemaProperty[] = currentProperties
): PropertyContext | null {
  for (const prop of currentSiblings) {
    if (prop.id === targetId) {
      return { property: prop, siblings: currentSiblings, parentId: currentParentId };
    }

    if (prop.children && prop.children.length > 0) {
      const foundInKids = findPropertyAndContext(currentProperties, targetId, prop.id, prop.children);
      if (foundInKids) return foundInKids;
    }

    if (prop.arrayItemSchema && prop.arrayItemSchema.length > 0) {
      const foundInArray = findPropertyAndContext(currentProperties, targetId, prop.id, prop.arrayItemSchema);
      if (foundInArray) return foundInArray;
    }
  }

  return null;
}

export function SchemaEditor({ initialSchema, onChange }: SchemaEditorProps) {
  const [properties, setProperties] = useState<SchemaProperty[]>(() => {
    if (initialSchema && initialSchema.length > 0) {
      return initialSchema;
    }

    return [createNewProperty()];
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Effect to reset errors if initialSchema changes externally
  useEffect(() => {
    setErrors({});
  }, [initialSchema]);

  const setSpecificError = useCallback((propertyId: string, message: string) => {
    setErrors((prev) => ({ ...prev, [propertyId]: message }));
  }, []);

  const clearSpecificError = useCallback((propertyId: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[propertyId];
      return newErrors;
    });
  }, []);

  const updateAndNotify = useCallback(
    (updatedProps: SchemaProperty[]) => {
      setProperties(updatedProps);
      onChange?.(updatedProps);
    },
    [onChange]
  );

  const handleAddProperty = useCallback(() => {
    const newProp = createNewProperty();
    const isNameTaken = !isNameUniqueInScope(newProp.name, properties);

    updateAndNotify([...properties, newProp]);

    if (isNameTaken) {
      setSpecificError(newProp.id, 'Property name must be unique. Please rename.');
    }
  }, [properties, updateAndNotify, setSpecificError]);

  const handleUpdateProperty = useCallback(
    (id: string, updates: Partial<SchemaProperty>) => {
      if (updates.name !== undefined) {
        const context = findPropertyAndContext(properties, id);

        if (context) {
          if (!isNameUniqueInScope(updates.name, context.siblings, id)) {
            setSpecificError(id, 'Property name must be unique at this level.');
            // Do not proceed with the update for the name if it's not unique.
            // If other fields were part of `updates`, they also won't be updated.
            // Consider if only name update should be blocked or all updates in this batch.
            // For now, blocking all if name update fails.
            return;
          } else {
            clearSpecificError(id);
          }
        } else {
          // Property not found, should ideally not happen if UI is consistent
          console.error('Property to update not found:', id);
          return;
        }
      }

      const updated = findAndUpdateRecursive(properties, id, 'update', updates);
      updateAndNotify(updated);
    },
    [properties, updateAndNotify, setSpecificError, clearSpecificError]
  );

  const handleDeleteProperty = useCallback(
    (id: string) => {
      clearSpecificError(id); // Clear error before deleting
      const updated = findAndUpdateRecursive(properties, id, 'delete');
      updateAndNotify(updated);
    },
    [properties, updateAndNotify, clearSpecificError]
  );

  const handleAddNestedProperty = useCallback(
    (parentId: string) => {
      const newNestedProp = createNewProperty();
      const parentContext = findPropertyAndContext(properties, parentId);
      const siblings = parentContext?.property.children || [];
      const isNameTaken = !isNameUniqueInScope(newNestedProp.name, siblings);

      updateAndNotify(findAndUpdateRecursive(properties, parentId, 'addChild', newNestedProp));

      if (isNameTaken) {
        setSpecificError(newNestedProp.id, 'Property name must be unique. Please rename.');
      }
    },
    [properties, updateAndNotify, setSpecificError]
  );

  const handleAddArrayItemProperty = useCallback(
    (arrayPropertyId: string) => {
      const newArrayItemProp = createNewProperty();
      const arrayPropContext = findPropertyAndContext(properties, arrayPropertyId);
      const siblings = arrayPropContext?.property.arrayItemSchema || [];
      const isNameTaken = !isNameUniqueInScope(newArrayItemProp.name, siblings);

      updateAndNotify(findAndUpdateRecursive(properties, arrayPropertyId, 'addArrayItemChild', newArrayItemProp));

      if (isNameTaken) {
        setSpecificError(newArrayItemProp.id, 'Property name must be unique. Please rename.');
      }
    },
    [properties, updateAndNotify, setSpecificError]
  );

  // Enum handlers remain largely the same, but a name change on an enum property
  // would now go through the updated handleUpdateProperty validation.
  const handleAddEnumChoice = useCallback(
    (propertyId: string) => {
      const context = findPropertyAndContext(properties, propertyId);

      if (context?.property.enumValues) {
        const newEnumValues = [...context.property.enumValues, ''];
        const updated = findAndUpdateRecursive(properties, propertyId, 'update', { enumValues: newEnumValues });
        updateAndNotify(updated);
      }
    },
    [properties, updateAndNotify]
  );

  const handleUpdateEnumChoice = useCallback(
    (propertyId: string, choiceIndex: number, value: string) => {
      const context = findPropertyAndContext(properties, propertyId);

      if (context?.property.enumValues) {
        const newEnumValues = [...context.property.enumValues];
        newEnumValues[choiceIndex] = value;
        const updated = findAndUpdateRecursive(properties, propertyId, 'update', { enumValues: newEnumValues });
        updateAndNotify(updated);
      }
    },
    [properties, updateAndNotify]
  );

  const handleDeleteEnumChoice = useCallback(
    (propertyId: string, choiceIndex: number) => {
      const context = findPropertyAndContext(properties, propertyId);

      if (context?.property.enumValues) {
        const newEnumValues = context.property.enumValues.filter((_, index) => index !== choiceIndex);
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
          errorMessage={errors[property.id]} // Pass down the error message
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
