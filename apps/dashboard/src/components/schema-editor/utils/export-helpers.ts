import type { SchemaProperty, SchemaValueType } from '../types';

// Maps our internal SchemaValueType to JSON Schema type strings.
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
    case 'enum': // Enums in JSON Schema are typically strings with an enum keyword
      return 'string';
    case 'null':
      return 'null';
    default:
      // Fallback for any unhandled types, though all should be covered.
      return 'string';
  }
}

// Converts a single SchemaProperty to its JSON Schema representation.
function convertPropertyToJsonSchema(property: SchemaProperty): Record<string, any> {
  const jsonSchemaProp: Record<string, any> = {
    type: mapOurTypeToJsonSchemaType(property.type),
  };

  if (property.description) {
    jsonSchemaProp.description = property.description;
  }

  if (property.defaultValue !== undefined) {
    jsonSchemaProp.default = property.defaultValue;
  }

  if (property.format) {
    jsonSchemaProp.format = property.format;
  }

  if (property.pattern) {
    jsonSchemaProp.pattern = property.pattern;
  }

  // Type-specific attributes
  if (property.type === 'string' || property.type === 'array') {
    if (property.minLength !== undefined) {
      jsonSchemaProp[property.type === 'array' ? 'minItems' : 'minLength'] = property.minLength;
    }

    if (property.maxLength !== undefined) {
      jsonSchemaProp[property.type === 'array' ? 'maxItems' : 'maxLength'] = property.maxLength;
    }
  }

  if (property.type === 'integer' || property.type === 'number') {
    if (property.minimum !== undefined) {
      jsonSchemaProp.minimum = property.minimum;
    }

    if (property.maximum !== undefined) {
      jsonSchemaProp.maximum = property.maximum;
    }
  }

  if (property.type === 'enum' && property.enumValues && property.enumValues.length > 0) {
    jsonSchemaProp.enum = property.enumValues;
  }

  if (property.type === 'array') {
    const itemType = property.arrayItemType || 'string'; // Default to string if not specified

    if (itemType === 'object') {
      if (property.arrayItemSchema && property.arrayItemSchema.length > 0) {
        const itemsProperties: Record<string, any> = {};
        const itemsRequired: string[] = [];
        property.arrayItemSchema.forEach((itemProp) => {
          itemsProperties[itemProp.name] = convertPropertyToJsonSchema(itemProp);

          if (itemProp.required) {
            itemsRequired.push(itemProp.name);
          }
        });
        jsonSchemaProp.items = { type: 'object', properties: itemsProperties };

        if (itemsRequired.length > 0) {
          jsonSchemaProp.items.required = itemsRequired;
        }
      } else {
        // Array of empty objects or objects with no defined properties
        jsonSchemaProp.items = { type: 'object', properties: {} };
      }
    } else {
      jsonSchemaProp.items = { type: mapOurTypeToJsonSchemaType(itemType) };
    }
  }

  if (property.type === 'object' && property.children && property.children.length > 0) {
    const objectProperties: Record<string, any> = {};
    const objectRequired: string[] = [];
    property.children.forEach((childProp) => {
      objectProperties[childProp.name] = convertPropertyToJsonSchema(childProp);

      if (childProp.required) {
        objectRequired.push(childProp.name);
      }
    });
    jsonSchemaProp.properties = objectProperties;

    if (objectRequired.length > 0) {
      jsonSchemaProp.required = objectRequired;
    }
  } else if (property.type === 'object') {
    // Object with no defined children/properties
    jsonSchemaProp.properties = {};
  }

  return jsonSchemaProp;
}

// Converts the root internal schema (array of SchemaProperty) to a full JSON Schema object.
export function convertInternalSchemaToJsonSchemaRoot(internalSchema: SchemaProperty[]): Record<string, any> {
  const rootJsonSchema: Record<string, any> = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {},
    required: [],
  };

  internalSchema.forEach((prop) => {
    if (prop.name) {
      // Ensure property has a name
      rootJsonSchema.properties[prop.name] = convertPropertyToJsonSchema(prop);

      if (prop.required) {
        rootJsonSchema.required.push(prop.name);
      }
    }
  });

  if (rootJsonSchema.required.length === 0) {
    delete rootJsonSchema.required;
  }

  if (Object.keys(rootJsonSchema.properties).length === 0) {
    // If there are no properties, it might be better to represent an empty object
    // or handle this case based on specific requirements.
    // For now, keeping it as an object with no properties.
  }

  return rootJsonSchema;
}
