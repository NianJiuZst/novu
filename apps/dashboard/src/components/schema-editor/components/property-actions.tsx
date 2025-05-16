import { useState, useCallback } from 'react';
import { RiSettings4Line, RiDeleteBin6Line } from 'react-icons/ri';
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

import { Button } from '@/components/primitives/button';
import { Popover, PopoverTrigger } from '@/components/primitives/popover';
import type { JSONSchema7 } from '../json-schema';
import { SchemaPropertySettingsPopover } from '../schema-property-settings-popover';

type PropertyActionsProps = {
  pathPrefix: string;
  propertyKey: string;
  currentPropertySchema: JSONSchema7;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  onDeleteProperty: () => void;
  isDisabled?: boolean;
};

export function PropertyActions({
  pathPrefix,
  propertyKey,
  currentPropertySchema,
  getValues,
  setValue,
  onDeleteProperty,
  isDisabled = false,
}: PropertyActionsProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveSettings = useCallback(
    (updatedSettings: Partial<JSONSchema7> & { _isNowRequired?: boolean }) => {
      const { _isNowRequired, ...actualSchemaChanges } = updatedSettings;
      const currentSchemaAtPath = getValues(pathPrefix) as JSONSchema7;
      const newSchemaFragment = { ...currentSchemaAtPath, ...actualSchemaChanges };

      Object.keys(newSchemaFragment).forEach((key) => {
        if (newSchemaFragment[key] === undefined) delete (newSchemaFragment as any)[key];
      });

      setValue(pathPrefix, newSchemaFragment, { shouldValidate: true, shouldDirty: true });

      if (_isNowRequired !== undefined) {
        let parentSchemaPath = '';

        if (pathPrefix.includes('.properties.'))
          parentSchemaPath = pathPrefix.substring(0, pathPrefix.lastIndexOf('.properties.'));
        else if (pathPrefix.includes('.items.properties.'))
          parentSchemaPath = pathPrefix.substring(0, pathPrefix.lastIndexOf('.items.properties.')) + '.items';
        else if (pathPrefix === 'schema') {
          // Root property special case
          // No parent for root, requirement is handled differently or not at all at root property level directly
        } else {
          // Might be a direct property of the root schema object, e.g. schema.myprop
          const parts = pathPrefix.split('.');

          if (parts.length === 2 && parts[0] === 'schema') {
            // This means it is like schema.X
            parentSchemaPath = parts[0];
          }
        }

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

  return (
    <>
      <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            mode="outline"
            size="2xs"
            className="text-text-soft"
            leadingIcon={RiSettings4Line}
            disabled={isDisabled}
            aria-label="Property settings"
          />
        </PopoverTrigger>
        {isSettingsOpen && currentPropertySchema && (
          <SchemaPropertySettingsPopover
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            propertySchema={currentPropertySchema}
            propertyKey={propertyKey}
            parentSchema={
              pathPrefix.includes('.properties.')
                ? getValues(pathPrefix.substring(0, pathPrefix.lastIndexOf('.properties.')))
                : pathPrefix.includes('.items.properties.')
                  ? getValues(pathPrefix.substring(0, pathPrefix.lastIndexOf('.items.properties.')) + '.items')
                  : getValues('schema') // Fallback to root schema for top-level properties
            }
            onSave={handleSaveSettings}
            onDelete={onDeleteProperty}
          />
        )}
      </Popover>
      <Button
        variant="error"
        mode="outline"
        size="2xs"
        leadingIcon={RiDeleteBin6Line}
        onClick={onDeleteProperty}
        disabled={isDisabled}
        aria-label="Delete property"
      />
    </>
  );
}
