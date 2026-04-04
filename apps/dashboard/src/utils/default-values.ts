import { Controls, UiSchemaGroupEnum } from '@novu/shared';
import {
  DEFAULT_CONTROL_HTTP_REQUEST_BODY,
  DEFAULT_CONTROL_HTTP_REQUEST_HEADERS,
  DEFAULT_CONTROL_HTTP_REQUEST_METHOD,
} from '@/utils/constants';
import { buildDefaultValues, buildDefaultValuesOfDataSchema } from '@/utils/schema';

function stringifyHttpControlField(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function normalizeHttpRequestKeyValueArray(raw: unknown): Array<{ key: string; value: string }> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((entry) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      return { key: '', value: '' };
    }

    const row = entry as Record<string, unknown>;

    return {
      key: stringifyHttpControlField(row.key),
      value: stringifyHttpControlField(row.value),
    };
  });
}

/**
 * Ensures HTTP request step control values match what CodeMirror-based inputs expect (string values).
 * API or persisted data may store structured JSON in header/body values, which would otherwise crash @uiw/react-codemirror.
 */
export function normalizeHttpRequestControlValues(values: Record<string, unknown>): Record<string, unknown> {
  const next = { ...values };

  if (typeof next.url !== 'string') {
    next.url = stringifyHttpControlField(next.url);
  }

  if (typeof next.method !== 'string' || next.method === '') {
    next.method = DEFAULT_CONTROL_HTTP_REQUEST_METHOD;
  }

  next.headers = normalizeHttpRequestKeyValueArray(next.headers ?? DEFAULT_CONTROL_HTTP_REQUEST_HEADERS);
  next.body = normalizeHttpRequestKeyValueArray(next.body ?? DEFAULT_CONTROL_HTTP_REQUEST_BODY);

  return next;
}

// Strips out null/undefined/empty-string entries so that unset saved values
// don't shadow schema-defined defaults during form initialization.
const stripEmptyValues = (values: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null && v !== undefined && v !== ''));
};

function deepMergeDefaults(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...defaults };

  for (const [key, value] of Object.entries(overrides)) {
    if (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      result[key] !== null &&
      result[key] !== undefined &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMergeDefaults(result[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// When uiSchema is non-empty, merges both schemas with dataSchema taking precedence over uiSchema for
// overlapping keys; controlValues take precedence over both. When uiSchema is empty, only dataSchema
// and controlValues are used.
export const getControlsDefaultValues = (resource: { controls: Controls }): Record<string, unknown> => {
  const controlValues = resource.controls.values;
  const strippedControlValues = stripEmptyValues(controlValues as Record<string, unknown>);

  const uiSchemaDefaultValues = buildDefaultValues(resource.controls.uiSchema ?? {});
  const dataSchemaDefaultValues = buildDefaultValuesOfDataSchema(resource.controls.dataSchema ?? {});

  if (Object.keys(resource.controls.uiSchema ?? {}).length !== 0) {
    const defaults = deepMergeDefaults(uiSchemaDefaultValues, dataSchemaDefaultValues);

    const merged = deepMergeDefaults(defaults, strippedControlValues);

    if (resource.controls.uiSchema?.group === UiSchemaGroupEnum.HTTP_REQUEST) {
      return normalizeHttpRequestControlValues(merged as Record<string, unknown>);
    }

    return merged;
  }

  const merged = deepMergeDefaults(dataSchemaDefaultValues, strippedControlValues);

  if (resource.controls.uiSchema?.group === UiSchemaGroupEnum.HTTP_REQUEST) {
    return normalizeHttpRequestControlValues(merged as Record<string, unknown>);
  }

  return merged;
};

// When uiSchema is non-empty, merges both schemas with uiSchema taking precedence over dataSchema for
// overlapping keys; controlValues take precedence over both. When uiSchema is empty, only dataSchema
// and controlValues are used.
export const getLayoutControlsDefaultValues = (resource: { controls: Controls }): Record<string, unknown> => {
  const controlValues = (resource.controls.values.email ?? {}) as Record<string, unknown>;

  const uiSchemaDefaultValues = buildDefaultValues(resource.controls.uiSchema ?? {});
  const dataSchemaDefaultValues = buildDefaultValuesOfDataSchema(resource.controls.dataSchema ?? {});

  if (Object.keys(resource.controls.uiSchema ?? {}).length !== 0) {
    return {
      ...dataSchemaDefaultValues,
      ...uiSchemaDefaultValues,
      ...controlValues,
    };
  }

  return {
    ...dataSchemaDefaultValues,
    ...controlValues,
  };
};
