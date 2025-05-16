import { useCallback } from 'react';
import type { Control, UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import type { JSONSchema7, JSONSchema7TypeName } from '../json-schema';
import {
  ensureArray,
  ensureBoolean,
  ensureEnum,
  ensureNull,
  ensureNumberOrInteger,
  ensureObject,
  ensureString,
} from '../utils/json-helpers';
import { SCHEMA_TYPE_OPTIONS } from '../constants';

type PropertyTypeSelectorProps = {
  currentType: JSONSchema7TypeName | 'enum' | undefined;
  pathPrefix: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>;
  isDisabled?: boolean;
  isItemType?: boolean; // To filter out enum and array for array item types
};

export function PropertyTypeSelector({
  currentType,
  pathPrefix,
  control,
  setValue,
  getValues,
  isDisabled = false,
  isItemType = false,
}: PropertyTypeSelectorProps) {
  const handleTypeChange = useCallback(
    (newSchemaType: JSONSchema7TypeName | 'enum') => {
      const currentSchema = getValues(pathPrefix) as JSONSchema7;
      if (!currentSchema) return;

      let newTransformedSchema: JSONSchema7;
      if (newSchemaType === 'enum') newTransformedSchema = ensureEnum(currentSchema);
      else if (newSchemaType === 'array') newTransformedSchema = ensureArray(currentSchema);
      else if (newSchemaType === 'object') newTransformedSchema = ensureObject(currentSchema);
      else if (newSchemaType === 'string') newTransformedSchema = ensureString(currentSchema);
      else if (newSchemaType === 'number' || newSchemaType === 'integer')
        newTransformedSchema = ensureNumberOrInteger(currentSchema, newSchemaType);
      else if (newSchemaType === 'boolean') newTransformedSchema = ensureBoolean(currentSchema);
      else if (newSchemaType === 'null') newTransformedSchema = ensureNull(currentSchema);
      else newTransformedSchema = { ...currentSchema, type: newSchemaType as JSONSchema7TypeName };

      setValue(pathPrefix, newTransformedSchema, { shouldValidate: true, shouldDirty: true });
    },
    [getValues, setValue, pathPrefix]
  );

  const handleArrayItemTypeChange = useCallback(
    (newItemSchemaType: JSONSchema7TypeName) => {
      const parentArraySchema = getValues(pathPrefix) as JSONSchema7; // Here pathPrefix is for the parent array
      if (!parentArraySchema || parentArraySchema.type !== 'array') return;

      const currentItemSchema = (parentArraySchema.items as JSONSchema7) || {};
      let newTransformedItemSchema: JSONSchema7;

      if (newItemSchemaType === 'object') newTransformedItemSchema = ensureObject(currentItemSchema);
      else if (newItemSchemaType === 'string') newTransformedItemSchema = ensureString(currentItemSchema);
      else if (newItemSchemaType === 'number' || newItemSchemaType === 'integer')
        newTransformedItemSchema = ensureNumberOrInteger(currentItemSchema, newItemSchemaType);
      else if (newItemSchemaType === 'boolean') newTransformedItemSchema = ensureBoolean(currentItemSchema);
      else if (newItemSchemaType === 'null') newTransformedItemSchema = ensureNull(currentItemSchema);
      else newTransformedItemSchema = { ...currentItemSchema, type: newItemSchemaType };

      setValue(`${pathPrefix}.items`, newTransformedItemSchema, { shouldValidate: true, shouldDirty: true });
    },
    [getValues, setValue, pathPrefix]
  );

  const typeOptions = isItemType
    ? SCHEMA_TYPE_OPTIONS.filter((opt) => opt.value !== 'enum' && opt.value !== 'array')
    : SCHEMA_TYPE_OPTIONS;

  const controllerName = isItemType ? `${pathPrefix}.items.type` : `${pathPrefix}.type`;
  const onValueChangeHandler = isItemType ? handleArrayItemTypeChange : handleTypeChange;
  const valueToUse = isItemType ? currentType : (currentType as string | undefined); // currentType will be item type for isItemType

  return (
    <Controller
      name={controllerName}
      control={control}
      render={() => (
        <Select
          value={valueToUse}
          onValueChange={(newTypeValue) => onValueChangeHandler(newTypeValue as JSONSchema7TypeName | 'enum')}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-[120px] text-sm" size="2xs">
            <SelectValue placeholder={isItemType ? 'Select item type' : 'Select type'} />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
