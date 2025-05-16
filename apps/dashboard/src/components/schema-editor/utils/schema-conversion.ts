import type { SchemaProperty, SchemaValueType } from '../types';

// --- FROM JSON SCHEMA TO INTERNAL SCHEMA ---

function jsonSchemaTypeToSchemaValueType(jsonType: string | string[]): SchemaValueType {
  const type = Array.isArray(jsonType) ? jsonType.find((t) => t !== 'null') || 'string' : jsonType;

  switch (type) {
    case 'integer':
      return 'integer';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    case 'null':
      return 'null';
    case 'string':
    default:
      return 'string'; // Enums will be 'string' here, then checked separately
  }
}

function parseJsonSchemaProperties(properties: Record<string, any>, requiredFields: Set<string>): SchemaProperty[] {
  const result: SchemaProperty[] = [];

  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const propSchema = properties[key];
      if (typeof propSchema !== 'object' || propSchema === null) continue;

      let editorType = jsonSchemaTypeToSchemaValueType(propSchema.type);

      if (propSchema.enum) {
        editorType = 'enum';
      }

      const schemaProperty: SchemaProperty = {
        id: key, // Consider generating a more unique ID if needed
        name: key,
        type: editorType,
        required: requiredFields.has(key),
        description: propSchema.description,
        defaultValue: propSchema.default,
        format: propSchema.format,
        minLength: propSchema.minLength,
        maxLength: propSchema.maxLength,
        minimum: propSchema.minimum,
        maximum: propSchema.maximum,
        pattern: propSchema.pattern,
      };

      if (editorType === 'enum' && Array.isArray(propSchema.enum)) {
        schemaProperty.enumValues = propSchema.enum.map(String);
      }

      if (editorType === 'object' && propSchema.properties) {
        const itemReqArray: string[] = (propSchema.required || []).map((val: any) => String(val));
        const nestedRequired = new Set<string>(itemReqArray);
        schemaProperty.children = parseJsonSchemaProperties(propSchema.properties, nestedRequired);
      }

      if (editorType === 'array' && propSchema.items) {
        const itemSchema = propSchema.items;

        if (typeof itemSchema === 'object' && itemSchema !== null) {
          let itemEditorType = jsonSchemaTypeToSchemaValueType(itemSchema.type);

          if (itemSchema.enum) {
            itemEditorType = 'enum';
          }

          schemaProperty.arrayItemType = itemEditorType;

          if (itemEditorType === 'object' && itemSchema.properties) {
            const itemReqArray: string[] = (itemSchema.required || []).map((val: any) => String(val));
            const nestedItemRequired = new Set<string>(itemReqArray);
            schemaProperty.arrayItemSchema = parseJsonSchemaProperties(itemSchema.properties, nestedItemRequired);
          }
          // TODO: Handle array of enums if SchemaProperty.arrayItemType === 'enum' and itemSchema.enum exists
        }
      }

      result.push(schemaProperty);
    }
  }

  return result;
}

function fromJSON(jsonSchema: any): {
  internalSchema: SchemaProperty[];
  unsupportedRootProperties: Record<string, any>;
} {
  const internalSchema: SchemaProperty[] = [];
  const unsupportedRootProperties: Record<string, any> = {};

  if (typeof jsonSchema !== 'object' || jsonSchema === null) {
    // If not an object, or null, treat the whole thing as unsupported if it's not trivially empty
    if (jsonSchema) {
      unsupportedRootProperties.value = jsonSchema; // Or some other way to represent non-object schema
    }

    return { internalSchema, unsupportedRootProperties };
  }

  if (jsonSchema.type !== 'object' && Object.keys(jsonSchema).length > 0) {
    // If it's an object but not type 'object' (e.g. a schema for a primitive at root),
    // capture all its props as unsupported, as our editor expects root to be 'object'
    for (const key in jsonSchema) {
      if (Object.prototype.hasOwnProperty.call(jsonSchema, key)) {
        unsupportedRootProperties[key] = jsonSchema[key];
      }
    }

    return { internalSchema, unsupportedRootProperties };
  }

  // If type is 'object' or not specified (implicitly object if properties exist)
  const properties = jsonSchema.properties || {};
  const rootReqArray: string[] = (jsonSchema.required || []).map((val: any) => String(val));
  const requiredFields = new Set<string>(rootReqArray);

  const parsedProps = parseJsonSchemaProperties(properties, requiredFields);
  internalSchema.push(...parsedProps);

  const knownRootProps = ['type', 'properties', 'required', '$schema', 'title', 'description', 'id', '$id'];

  for (const key in jsonSchema) {
    if (Object.prototype.hasOwnProperty.call(jsonSchema, key)) {
      if (!knownRootProps.includes(key)) {
        unsupportedRootProperties[key] = jsonSchema[key];
      }
    }
  }

  // Explicitly capture well-known root props that aren't part of the properties themselves
  if (jsonSchema.$schema) unsupportedRootProperties.$schema = jsonSchema.$schema;
  if (jsonSchema.title) unsupportedRootProperties.title = jsonSchema.title;
  if (jsonSchema.description) unsupportedRootProperties.description = jsonSchema.description;
  // id or $id for schema identification
  if (jsonSchema.id) unsupportedRootProperties.id = jsonSchema.id;
  if (jsonSchema.$id) unsupportedRootProperties.$id = jsonSchema.$id;

  return { internalSchema, unsupportedRootProperties };
}

// --- FROM INTERNAL SCHEMA TO JSON SCHEMA ---

function mapOurTypeToJsonSchemaType(ourType: SchemaValueType): string | string[] {
  switch (ourType) {
    case 'integer':
      return 'integer';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    case 'enum':
      return 'string'; // JSON Schema enums are typed by their values (e.g. string) + enum keyword
    case 'null':
      return 'null';
    default:
      return 'string';
  }
}

function convertPropertyToJsonSchema(property: SchemaProperty): Record<string, any> {
  const jsonSchemaProp: Record<string, any> = {
    type: mapOurTypeToJsonSchemaType(property.type),
  };

  if (property.description) jsonSchemaProp.description = property.description;
  if (property.defaultValue !== undefined) jsonSchemaProp.default = property.defaultValue;
  if (property.format) jsonSchemaProp.format = property.format;
  if (property.pattern) jsonSchemaProp.pattern = property.pattern;

  if (property.type === 'string') {
    // minLength/maxLength only for string
    if (property.minLength !== undefined) jsonSchemaProp.minLength = property.minLength;
    if (property.maxLength !== undefined) jsonSchemaProp.maxLength = property.maxLength;
  }

  if (property.type === 'array') {
    // minItems/maxItems for array (mapped from minLength/maxLength)
    if (property.minLength !== undefined) jsonSchemaProp.minItems = property.minLength;
    if (property.maxLength !== undefined) jsonSchemaProp.maxItems = property.maxLength;
  }

  if (property.type === 'integer' || property.type === 'number') {
    if (property.minimum !== undefined) jsonSchemaProp.minimum = property.minimum;
    if (property.maximum !== undefined) jsonSchemaProp.maximum = property.maximum;
  }

  if (property.type === 'enum' && property.enumValues && property.enumValues.length > 0) {
    jsonSchemaProp.enum = property.enumValues;
  }

  if (property.type === 'array') {
    const itemType = property.arrayItemType || 'string';

    if (itemType === 'object') {
      if (property.arrayItemSchema && property.arrayItemSchema.length > 0) {
        const itemsProperties: Record<string, any> = {};
        const itemsRequired: string[] = [];
        property.arrayItemSchema.forEach((itemProp) => {
          itemsProperties[itemProp.name] = convertPropertyToJsonSchema(itemProp);
          if (itemProp.required) itemsRequired.push(itemProp.name);
        });
        jsonSchemaProp.items = { type: 'object', properties: itemsProperties };
        if (itemsRequired.length > 0) jsonSchemaProp.items.required = itemsRequired;
      } else {
        jsonSchemaProp.items = { type: 'object', properties: {} };
      }
    } else {
      // TODO: Handle array of enums. If itemType is 'enum', need to look at itemSchema.enum
      jsonSchemaProp.items = { type: mapOurTypeToJsonSchemaType(itemType) };
    }
  }

  if (property.type === 'object' && property.children && property.children.length > 0) {
    const objectProperties: Record<string, any> = {};
    const objectRequired: string[] = [];
    property.children.forEach((childProp) => {
      objectProperties[childProp.name] = convertPropertyToJsonSchema(childProp);
      if (childProp.required) objectRequired.push(childProp.name);
    });
    jsonSchemaProp.properties = objectProperties;
    if (objectRequired.length > 0) jsonSchemaProp.required = objectRequired;
  } else if (property.type === 'object') {
    jsonSchemaProp.properties = {};
  }

  return jsonSchemaProp;
}

function toJSON(
  internalSchema: SchemaProperty[],
  unsupportedRootProperties?: Record<string, any>
): Record<string, any> {
  const rootJsonSchema: Record<string, any> = {
    // Default base, will be overridden by unsupportedRootProperties if present
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {},
  };

  const requiredProps: string[] = [];

  internalSchema.forEach((prop) => {
    if (prop.name) {
      rootJsonSchema.properties[prop.name] = convertPropertyToJsonSchema(prop);

      if (prop.required) {
        requiredProps.push(prop.name);
      }
    }
  });

  if (requiredProps.length > 0) {
    rootJsonSchema.required = requiredProps;
  }

  // Merge back unsupported properties, potentially overwriting defaults like $schema or type
  if (unsupportedRootProperties) {
    for (const key in unsupportedRootProperties) {
      if (Object.prototype.hasOwnProperty.call(unsupportedRootProperties, key)) {
        rootJsonSchema[key] = unsupportedRootProperties[key];
      }
    }
  }

  // Ensure type: 'object' if not otherwise specified by unsupported properties
  if (!rootJsonSchema.type && Object.keys(rootJsonSchema.properties).length > 0) {
    rootJsonSchema.type = 'object';
  }

  return rootJsonSchema;
}

export const SchemaConverter = {
  fromJSON,
  toJSON,
};
