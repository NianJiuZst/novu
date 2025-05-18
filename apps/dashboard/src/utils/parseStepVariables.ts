import { Completion } from '@codemirror/autocomplete';

import { isAllowedAlias } from '@/components/workflow-editor/steps/email/variables/variables';

import type { JSONSchemaDefinition } from '@novu/shared';
import {
  DIGEST_VARIABLES,
  DIGEST_VARIABLES_ENUM,
  getDynamicDigestVariable,
} from '../components/variable/utils/digest-variables';

export interface LiquidVariable {
  type?: 'variable' | 'digest';
  name: string;
  boost?: number;
  info?: Completion['info'];
  displayLabel?: string;
  aliasFor?: string | null;
}

export type IsAllowedVariable = (variable: LiquidVariable) => boolean;
export type IsArbitraryNamespace = (path: string) => boolean;

export interface ParsedVariables {
  primitives: LiquidVariable[];
  arrays: LiquidVariable[];
  variables: LiquidVariable[];
  namespaces: LiquidVariable[];
  isAllowedVariable: IsAllowedVariable;
  isVariableInSchema: (variable: LiquidVariable) => boolean;
}

/**
 * Parses a variable path string (e.g., "user.profile.name" or "steps.digest.events[0].payload")
 * into an array of its constituent parts.
 * @param path The variable path string.
 * @returns An array of path segments, or null if the path is invalid.
 */
function parseVariablePath(path: string): string[] | null {
  const parts = path
    .split(/\\.|\\[(\\d+)\\]/) // Split by dots or array accessors like [0]
    .filter(Boolean) // Remove empty strings that can result from splitting
    .map((part): string | null => {
      const num = parseInt(part);

      // If it's a number, ensure it's a non-negative integer for array indices
      if (!isNaN(num)) {
        if (num < 0) return null; // Invalid array index
        return num.toString().trim();
      }

      return part.trim(); // Otherwise, it's a property name
    });

  // If any part became null (e.g., due to invalid array index), the whole path is invalid
  return parts.includes(null) ? null : (parts as string[]);
}

/**
 * Checks if a given variable is defined within the provided JSON schema.
 * @param variable The variable to check.
 * @param schema The JSON schema definition.
 * @param primitivesInSchema A list of known primitive variables extracted from the schema.
 * @returns True if the variable is defined in the schema, false otherwise.
 */
function isVariableInSchemaInternal(
  variable: LiquidVariable,
  schema: JSONSchemaDefinition, // Schema for the namespace's content, or root schema if no namespace
  primitivesInSchema: LiquidVariable[], // Primitives relative to the schema passed
  baseNamespace?: string
): boolean {
  if (typeof schema === 'boolean') return false;

  if (variable.aliasFor && !isAllowedAlias(variable.name)) {
    return false;
  }

  const fullPathFromVar = variable.name.split('|')[0];
  let pathToCheck = fullPathFromVar;

  if (baseNamespace) {
    if (fullPathFromVar.startsWith(baseNamespace + '.')) {
      pathToCheck = fullPathFromVar.substring(baseNamespace.length + 1);
      if (pathToCheck === '') return false; // "payload." is not a valid variable path itself
    } else if (fullPathFromVar === baseNamespace) {
      // Variable name is exactly the namespace (e.g. "payload")
      // Valid if the provided schema is an object, representing that namespace.
      return typeof schema === 'object' && schema.type === 'object';
    } else {
      return false; // Variable name does not match the expected namespace prefix
    }
  }
  // If no baseNamespace, pathToCheck remains fullPathFromVar, and schema is root schema.

  // Check against primitives (which are relative to the schema, so match pathToCheck)
  if (primitivesInSchema.some((primitive) => primitive.name === pathToCheck)) {
    return true;
  }

  const parts = parseVariablePath(pathToCheck);
  if (!parts) return false;

  let currentSubSchema: JSONSchemaDefinition = schema;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (typeof currentSubSchema === 'boolean' || !('type' in currentSubSchema)) return false;

    if (currentSubSchema.type === 'array') {
      if (!currentSubSchema.items) return false;
      const itemsSchema: JSONSchemaDefinition = Array.isArray(currentSubSchema.items)
        ? currentSubSchema.items[0]
        : currentSubSchema.items;
      if (typeof itemsSchema === 'boolean') return false;
      currentSubSchema = itemsSchema;
    } else if (currentSubSchema.type === 'object') {
      if (currentSubSchema.additionalProperties === true) return true;
      if (!currentSubSchema.properties || !(part in currentSubSchema.properties)) return false;
      currentSubSchema = currentSubSchema.properties[part];
    } else {
      return i === parts.length - 1;
    }
  }

  return true;
}

/**
 * Parse JSON Schema and extract variables for Liquid autocompletion.
 * @param schema - The JSON Schema to parse.
 * @param options - Options including digestStepId and pendingVariablesSet.
 * @returns An object containing primitives, arrays, namespaces, and validation functions.
 */
export function parseStepVariables(
  schema: JSONSchemaDefinition, // If baseNamespace is given, this is the schema for that namespace's content.
  options: { digestStepId?: string; pendingVariablesSet?: Set<string>; baseNamespace?: string } = {}
): ParsedVariables {
  const { digestStepId, pendingVariablesSet, baseNamespace } = options;
  const relativePrimitives: LiquidVariable[] = [];
  const relativeArrays: LiquidVariable[] = [];

  function extractProperties(obj: JSONSchemaDefinition, currentRelativePath = ''): void {
    if (typeof obj === 'boolean') return;

    if (obj.type === 'object') {
      if (!obj.properties) return;

      for (const [key, value] of Object.entries(obj.properties)) {
        const fullRelativePath = currentRelativePath ? `${currentRelativePath}.${key}` : key;

        if (typeof value === 'object') {
          if (value.type === 'array') {
            relativeArrays.push({ name: fullRelativePath });

            if (value.items) {
              const items = Array.isArray(value.items) ? value.items[0] : value.items;
              extractProperties(items, `${fullRelativePath}[0]`);
            }
          } else if (value.type === 'object') {
            extractProperties(value, fullRelativePath);
          } else if (value.type && ['string', 'number', 'boolean', 'integer'].includes(value.type as string)) {
            relativePrimitives.push({ name: fullRelativePath });
          }
        }
      }
    }

    ['allOf', 'anyOf', 'oneOf'].forEach((combiner) => {
      if (Array.isArray(obj[combiner as keyof typeof obj])) {
        for (const subSchema of obj[combiner as keyof typeof obj] as JSONSchemaDefinition[]) {
          extractProperties(subSchema, currentRelativePath);
        }
      }
    });
    if (obj.if) extractProperties(obj.if, currentRelativePath);
    if (obj.then) extractProperties(obj.then, currentRelativePath);
    if (obj.else) extractProperties(obj.else, currentRelativePath);
  }

  extractProperties(schema);

  const fullyQualifiedPrimitives = baseNamespace
    ? relativePrimitives.map((v) => ({ ...v, name: `${baseNamespace}.${v.name}` }))
    : relativePrimitives;

  const fullyQualifiedArrays = baseNamespace
    ? relativeArrays.map((v) => ({ ...v, name: `${baseNamespace}.${v.name}` }))
    : relativeArrays;

  const memoizedIsVariableInSchema = (variable: LiquidVariable): boolean => {
    // Pass relative primitives to internal check, as it expects them if namespace is used.
    return isVariableInSchemaInternal(variable, schema, relativePrimitives, baseNamespace);
  };

  const isAllowedVariable = (variable: LiquidVariable): boolean => {
    if (pendingVariablesSet?.has(variable.name.split('|')[0])) {
      return true;
    }

    return memoizedIsVariableInSchema(variable);
  };

  const allOutputVariables = [...fullyQualifiedPrimitives, ...fullyQualifiedArrays];
  const digestVars = digestStepId
    ? DIGEST_VARIABLES.map((variable) => {
        const { label: displayLabel, value } = getDynamicDigestVariable({
          digestStepName: digestStepId,
          type: variable.name as DIGEST_VARIABLES_ENUM,
        });
        return { ...variable, name: value, displayLabel };
      })
    : [];

  return {
    primitives: fullyQualifiedPrimitives, // For autocomplete, these should be fully qualified
    arrays: fullyQualifiedArrays, // For autocomplete
    variables: [...digestVars, ...allOutputVariables],
    namespaces: [],
    isAllowedVariable,
    isVariableInSchema: memoizedIsVariableInSchema,
  };
}

// Exporting the internal function for testing or specific use cases if necessary, but generally
// the one returned by parseStepVariables (memoizedIsVariableInSchema) should be used.
export { isVariableInSchemaInternal as isVariableInSchema };
