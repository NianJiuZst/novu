import type { SchemaProperty, SchemaValueType } from '../types';

// Function to create a new schema property with default values
export const createNewProperty = (name?: string): SchemaProperty => ({
  id: crypto.randomUUID(),
  name: name || '',
  type: 'string' as SchemaValueType,
  description: '',
  required: false,
  format: '',
  pattern: '',
  minLength: undefined,
  maxLength: undefined,
  minimum: undefined,
  maximum: undefined,
  enumValues: [],
  children: [],
  arrayItemType: 'string' as SchemaValueType,
  arrayItemSchema: [],
});
