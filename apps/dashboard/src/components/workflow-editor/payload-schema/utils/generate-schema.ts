import type { JSONSchema7 } from '@/components/schema-editor/json-schema';

export type RequiredFieldStrategy = 'none' | 'all' | 'heuristic' | 'custom';

export type SchemaGenerationOptions = {
  /**
   * Strategy for determining which fields should be marked as required
   * - 'none': No fields are required
   * - 'all': All fields are required (previous behavior)
   * - 'heuristic': Fields are required based on value analysis (default)
   * - 'custom': Only specified fields are required
   */
  requiredFieldStrategy?: RequiredFieldStrategy;
  /**
   * Array of field names to mark as required when using 'custom' strategy
   */
  customRequiredFields?: string[];
  /**
   * When using heuristic strategy, this controls the minimum confidence level
   * for marking a field as required (0-1, default: 0.8)
   */
  heuristicThreshold?: number;
  /**
   * Whether to sanitize property names to make them valid identifiers
   * Defaults to true to ensure generated schemas have valid property names
   */
  sanitizePropertyNames?: boolean;
};

/**
 * Sanitizes a property name to conform to validation rules:
 * - Must start with a letter or underscore
 * - Can only contain letters, numbers, or underscores
 * - Preserves the original meaning as much as possible
 */
export function sanitizePropertyName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'property';
  }

  // Replace invalid characters with underscores
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Ensure it starts with a letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }
  
  // Remove consecutive underscores
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Remove trailing underscores
  sanitized = sanitized.replace(/_+$/, '');
  
  // Ensure it's not empty
  return sanitized || 'property';
}

/**
 * Ensures property names are unique by appending numbers to duplicates
 */
export function ensureUniquePropertyNames(names: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedNames = new Set<string>();
  
  for (const originalName of names) {
    const sanitized = sanitizePropertyName(originalName);
    let uniqueName = sanitized;
    let counter = 1;
    
    while (usedNames.has(uniqueName)) {
      uniqueName = `${sanitized}_${counter}`;
      counter++;
    }
    
    usedNames.add(uniqueName);
    mapping[originalName] = uniqueName;
  }
  
  return mapping;
}

/**
 * Removes internal keys from the payload that shouldn't be part of the schema
 */
export function cleanPayloadData(payload: any): any {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const cleanPayload = { ...payload };
  // Remove internal Novu keys
  delete cleanPayload.__source;

  return cleanPayload;
}

/**
 * Analyzes a value to determine if it should be considered required
 * based on heuristics like value presence, type, and content
 */
function shouldBeRequired(value: unknown, threshold: number = 0.8): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  // Empty strings, arrays, or objects are less likely to be required
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }

  if (Array.isArray(value) && value.length === 0) {
    return false;
  }

  if (typeof value === 'object' && Object.keys(value as Record<string, unknown>).length === 0) {
    return false;
  }

  // Values that seem meaningful are more likely to be required
  if (typeof value === 'boolean' || typeof value === 'number') {
    return true;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return true;
  }

  if (Array.isArray(value) && value.length > 0) {
    return true;
  }

  if (typeof value === 'object' && Object.keys(value as Record<string, unknown>).length > 0) {
    return true;
  }

  return false;
}

/**
 * Determines which fields should be marked as required based on the strategy
 */
function determineRequiredFields(
  obj: Record<string, unknown>,
  strategy: RequiredFieldStrategy,
  customFields?: string[],
  threshold?: number
): string[] {
  const allKeys = Object.keys(obj);

  switch (strategy) {
    case 'none':
      return [];

    case 'all':
      return allKeys;

    case 'custom':
      return customFields?.filter((field) => allKeys.includes(field)) || [];

    case 'heuristic':
    default:
      return allKeys.filter((key) => shouldBeRequired(obj[key], threshold));
  }
}

/**
 * Determines the JSONSchema7 type for a given value
 */
function determineSchemaType(value: unknown, options: SchemaGenerationOptions = {}): JSONSchema7 {
  if (value === null) {
    return { type: 'null' };
  }

  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? determineSchemaType(value[0], options) : { type: 'string' },
    };
  }

  switch (typeof value) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };

    case 'object': {
      const properties: { [key: string]: JSONSchema7 } = {};
      const objValue = value as Record<string, unknown>;
      const shouldSanitize = options.sanitizePropertyNames !== false; // Default to true

      if (shouldSanitize) {
        // Handle sanitization with duplicate prevention
        const originalKeys = Object.keys(objValue);
        const nameMapping = ensureUniquePropertyNames(originalKeys);
        
        for (const [originalKey, val] of Object.entries(objValue)) {
          const sanitizedKey = nameMapping[originalKey];
          properties[sanitizedKey] = determineSchemaType(val, options);
        }
        
        const requiredFields = determineRequiredFields(
          objValue,
          options.requiredFieldStrategy || 'heuristic',
          options.customRequiredFields,
          options.heuristicThreshold
        ).map(field => nameMapping[field]).filter(Boolean);

        return {
          type: 'object',
          properties,
          ...(requiredFields.length > 0 && { required: requiredFields }),
        };
      } else {
        // Original behavior without sanitization
        for (const [key, val] of Object.entries(objValue)) {
          properties[key] = determineSchemaType(val, options);
        }

        const requiredFields = determineRequiredFields(
          objValue,
          options.requiredFieldStrategy || 'heuristic',
          options.customRequiredFields,
          options.heuristicThreshold
        );

        return {
          type: 'object',
          properties,
          ...(requiredFields.length > 0 && { required: requiredFields }),
        };
      }
    }

    default:
      return { type: 'string' };
  }
}

/**
 * Generates a JSONSchema7 from JSON data
 */
export function generateSchemaFromJson(jsonData: any, options: SchemaGenerationOptions = {}): JSONSchema7 {
  const schema = determineSchemaType(jsonData, options);

  if (schema.type === 'object') {
    return schema;
  }

  // If the root is not an object, wrap it in a payload property
  return {
    type: 'object',
    properties: {
      payload: schema,
    },
    required: ['payload'],
  };
}

/**
 * Validates if a string contains valid JSON
 */
export function isValidJson(value: string): boolean {
  if (!value.trim()) return false;

  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}
