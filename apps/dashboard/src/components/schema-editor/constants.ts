import type { SchemaValueType } from './types';

export interface SchemaTypeOption {
  label: string;
  value: SchemaValueType;
}

export const SCHEMA_TYPE_OPTIONS: SchemaTypeOption[] = [
  { label: 'String', value: 'string' },
  { label: 'Integer', value: 'integer' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Enum', value: 'enum' },
  { label: 'Array', value: 'array' },
  { label: 'Object', value: 'object' },
  { label: 'Null', value: 'null' },
];

export const DEFAULT_PROPERTY_NAME = 'newProperty';
