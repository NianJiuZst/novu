/**
 * Defines the possible data types for a schema property.
 */
export type SchemaValueType =
  | 'string'
  | 'integer'
  | 'number' // Added number for more general numeric types
  | 'boolean'
  | 'enum'
  | 'array'
  | 'object'
  | 'null'; // Added null type

/**
 * Represents a single property within the JSON schema.
 */
export type SchemaProperty = {
  id: string; // Unique identifier for the property row, useful for list rendering
  name: string;
  type: SchemaValueType;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  // For 'enum' type
  enumValues?: string[];
  // For 'array' type
  arrayItemType?: SchemaValueType;
  // For 'array' of 'object' type - stores the schema for items
  arrayItemSchema?: SchemaProperty[];
  // For 'object' type
  children?: SchemaProperty[];
  // Additional properties for validation (examples)
  format?: string; // e.g., 'date-time', 'email' for strings
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string; // regex for strings
};

/**
 * Represents the overall structure of the schema being edited.
 */
export type Schema = {
  $schema?: string; // Typically http://json-schema.org/draft-07/schema#
  type: 'object';
  properties: Record<
    string,
    Omit<SchemaProperty, 'id' | 'name' | 'children'> & { properties?: Record<string, any>; items?: any }
  >;
  required?: string[];
};
