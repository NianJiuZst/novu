import type { JSONSchema7, JSONSchema7TypeName } from '../json-schema';

export function newProperty(type: JSONSchema7TypeName = 'string'): JSONSchema7 {
  const baseProperty: JSONSchema7 = { type };

  if (type === 'object') {
    baseProperty.properties = {};
    baseProperty.required = [];
  }

  if (type === 'array') {
    baseProperty.items = { type: 'string' }; // Default to array of strings
  }

  // Add other type-specific defaults as needed

  return baseProperty;
}

export function ensureObject(schema: JSONSchema7): JSONSchema7 {
  if (schema.type !== 'object') {
    // Clear other type-specific properties if changing type
    const { properties, required, ...restOfSchema } = schema as any; // eslint-disable-line @typescript-eslint/no-unused-vars
    const newSchema: JSONSchema7 = { ...restOfSchema };
    newSchema.type = 'object';
    newSchema.properties = {};
    newSchema.required = [];
    // Remove array specific
    delete (newSchema as any).items;
    delete (newSchema as any).minItems;
    delete (newSchema as any).maxItems;
    delete (newSchema as any).uniqueItems;
    // Remove enum specific
    delete (newSchema as any).enum;

    return newSchema;
  }

  if (!schema.properties) {
    schema.properties = {};
  }
  // if (!schema.required) {
  //   schema.required = []; // Only add if it makes sense for your use case
  // }

  return schema;
}

export function ensureArray(schema: JSONSchema7): JSONSchema7 {
  if (schema.type !== 'array') {
    const { items, minItems, maxItems, uniqueItems, ...restOfSchema } = schema as any; // eslint-disable-line @typescript-eslint/no-unused-vars
    const newSchema: JSONSchema7 = { ...restOfSchema };
    newSchema.type = 'array';
    newSchema.items = { type: 'string' }; // Default to array of strings
    // Remove object specific
    delete (newSchema as any).properties;
    delete (newSchema as any).required;
    delete (newSchema as any).additionalProperties;
    delete (newSchema as any).patternProperties;
    // Remove enum specific
    delete (newSchema as any).enum;

    return newSchema;
  }

  if (schema.items === undefined) {
    schema.items = { type: 'string' }; // Default to array of strings
  }

  return schema;
}

export function ensureString(schema: JSONSchema7): JSONSchema7 {
  if (schema.type !== 'string') {
    const { ...restOfSchema } = schema as any;
    const newSchema: JSONSchema7 = { ...restOfSchema };
    newSchema.type = 'string';
    // Remove object specific
    delete (newSchema as any).properties;
    delete (newSchema as any).required;
    delete (newSchema as any).additionalProperties;
    delete (newSchema as any).patternProperties;
    // Remove array specific
    delete (newSchema as any).items;
    delete (newSchema as any).minItems;
    delete (newSchema as any).maxItems;
    delete (newSchema as any).uniqueItems;
    // Remove enum specific
    delete (newSchema as any).enum;

    return newSchema;
  }

  return schema;
}

export function ensureNumberOrInteger(schema: JSONSchema7, newType: 'number' | 'integer'): JSONSchema7 {
  if (schema.type !== newType) {
    const { ...restOfSchema } = schema as any;
    const newSchema: JSONSchema7 = { ...restOfSchema };
    newSchema.type = newType;
    // Remove object specific
    delete (newSchema as any).properties;
    delete (newSchema as any).required;
    delete (newSchema as any).additionalProperties;
    delete (newSchema as any).patternProperties;
    // Remove array specific
    delete (newSchema as any).items;
    delete (newSchema as any).minItems;
    delete (newSchema as any).maxItems;
    delete (newSchema as any).uniqueItems;
    // Remove enum specific
    delete (newSchema as any).enum;

    return newSchema;
  }

  return schema;
}

export function ensureBoolean(schema: JSONSchema7): JSONSchema7 {
  if (schema.type !== 'boolean') {
    const { ...restOfSchema } = schema as any;
    const newSchema: JSONSchema7 = { ...restOfSchema };
    newSchema.type = 'boolean';
    // Remove object specific
    delete (newSchema as any).properties;
    delete (newSchema as any).required;
    delete (newSchema as any).additionalProperties;
    delete (newSchema as any).patternProperties;
    // Remove array specific
    delete (newSchema as any).items;
    delete (newSchema as any).minItems;
    delete (newSchema as any).maxItems;
    delete (newSchema as any).uniqueItems;
    // Remove enum specific
    delete (newSchema as any).enum;

    return newSchema;
  }

  return schema;
}

export function ensureNull(schema: JSONSchema7): JSONSchema7 {
  if (schema.type !== 'null') {
    const { ...restOfSchema } = schema as any;
    const newSchema: JSONSchema7 = { ...restOfSchema };
    newSchema.type = 'null';
    // Remove object specific
    delete (newSchema as any).properties;
    delete (newSchema as any).required;
    delete (newSchema as any).additionalProperties;
    delete (newSchema as any).patternProperties;
    // Remove array specific
    delete (newSchema as any).items;
    delete (newSchema as any).minItems;
    delete (newSchema as any).maxItems;
    delete (newSchema as any).uniqueItems;
    // Remove enum specific
    delete (newSchema as any).enum;

    return newSchema;
  }

  return schema;
}

export function ensureEnum(schema: JSONSchema7): JSONSchema7 {
  if (!schema.enum) {
    const { ...restOfSchema } = schema as any;
    const newSchema: JSONSchema7 = { ...restOfSchema };
    // JSON Schema enums are type string with an enum keyword
    newSchema.type = 'string';
    newSchema.enum = ['']; // Default with one empty choice
    // Remove object specific
    delete (newSchema as any).properties;
    delete (newSchema as any).required;
    delete (newSchema as any).additionalProperties;
    delete (newSchema as any).patternProperties;
    // Remove array specific
    delete (newSchema as any).items;
    delete (newSchema as any).minItems;
    delete (newSchema as any).maxItems;
    delete (newSchema as any).uniqueItems;

    return newSchema;
  }

  if (schema.type !== 'string') {
    // Ensure type is string for enums, as per JSON Schema spec for enums we support
    schema.type = 'string';
  }

  return schema;
}
