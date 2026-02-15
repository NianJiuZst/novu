import { Controls } from '@novu/shared';
import { buildDefaultValues, buildDefaultValuesOfDataSchema } from '@/utils/schema';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMergeDefaults(defaults: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...defaults };

  for (const key of Object.keys(overrides)) {
    const overrideValue = overrides[key];

    if (overrideValue === null || overrideValue === undefined) {
      result[key] = overrideValue;
    } else if (isPlainObject(overrideValue) && isPlainObject(result[key])) {
      result[key] = deepMergeDefaults(result[key] as Record<string, unknown>, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }

  return result;
}

// Use the UI Schema to build the default values if it exists else use the data schema (code-first approach) values
export const getControlsDefaultValues = (resource: { controls: Controls }): Record<string, unknown> => {
  const controlValues = resource.controls.values;

  const uiSchemaDefaultValues = buildDefaultValues(resource.controls.uiSchema ?? {});
  const dataSchemaDefaultValues = buildDefaultValuesOfDataSchema(resource.controls.dataSchema ?? {});

  if (Object.keys(resource.controls.uiSchema ?? {}).length !== 0) {
    return deepMergeDefaults(uiSchemaDefaultValues, controlValues);
  }

  return deepMergeDefaults(dataSchemaDefaultValues, controlValues);
};

// Use the UI Schema to build the default values if it exists else use the data schema (code-first approach) values
export const getLayoutControlsDefaultValues = (resource: { controls: Controls }): Record<string, unknown> => {
  const controlValues = (resource.controls.values.email ?? {}) as Record<string, unknown>;

  const uiSchemaDefaultValues = buildDefaultValues(resource.controls.uiSchema ?? {});
  const dataSchemaDefaultValues = buildDefaultValuesOfDataSchema(resource.controls.dataSchema ?? {});

  if (Object.keys(resource.controls.uiSchema ?? {}).length !== 0) {
    return deepMergeDefaults(uiSchemaDefaultValues, controlValues);
  }

  return deepMergeDefaults(dataSchemaDefaultValues, controlValues);
};
