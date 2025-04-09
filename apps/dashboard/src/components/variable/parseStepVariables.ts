import type { JSONSchemaDefinition } from '@novu/shared';

export interface LiquidVariable {
  type: 'variable';
  label: string;
}

export type IsAllowedVariable = (path: string) => boolean;
export type IsArbitraryNamespace = (path: string) => boolean;

export interface ParsedVariables {
  primitives: LiquidVariable[];
  arrays: LiquidVariable[];
  variables: LiquidVariable[];
  namespaces: LiquidVariable[];
  isAllowedVariable: IsAllowedVariable;
}

/**
 * Parse JSON Schema and extract variables for Liquid autocompletion.
 * @param schema - The JSON Schema to parse.
 * @returns An object containing three arrays: primitives, arrays, and namespaces.
 */
export function parseStepVariables(schema: JSONSchemaDefinition, isEnhancedDigestEnabled: boolean): ParsedVariables {
  const result: ParsedVariables = {
    /**
     * deprecated: use variables instead
     */
    primitives: [],
    arrays: [],
    variables: [],
    namespaces: [],
    isAllowedVariable: () => false,
  };

  function extractProperties(obj: JSONSchemaDefinition, path = ''): void {
    if (typeof obj === 'boolean') return;

    if (obj.type === 'object') {
      if (obj.additionalProperties === true) {
        result.namespaces.push({
          type: 'variable',
          label: path,
        });
      }

      for (const [key, value] of Object.entries(obj.properties || {})) {
        const fullPath = path ? `${path}.${key}` : key;

        if (typeof value === 'object') {
          if (value.type === 'array') {
            result.arrays.push({
              type: 'variable',
              label: fullPath,
            });

            if (value.properties) {
              extractProperties({ type: 'object', properties: value.properties }, fullPath);
            }

            if (value.items) {
              const items = Array.isArray(value.items) ? value.items[0] : value.items;
              extractProperties(items, `${fullPath}[0]`);
            }
          } else if (value.type === 'object') {
            extractProperties(value, fullPath);
          } else if (value.type && ['string', 'number', 'boolean', 'integer'].includes(value.type as string)) {
            result.primitives.push({
              type: 'variable',
              label: fullPath,
            });
          }
        }
      }
    }

    // Handle combinators (allOf, anyOf, oneOf)
    ['allOf', 'anyOf', 'oneOf'].forEach((combiner) => {
      if (Array.isArray(obj[combiner as keyof typeof obj])) {
        for (const subSchema of obj[combiner as keyof typeof obj] as JSONSchemaDefinition[]) {
          extractProperties(subSchema, path);
        }
      }
    });

    // Handle conditional schemas (if/then/else)
    if (obj.if) extractProperties(obj.if, path);
    if (obj.then) extractProperties(obj.then, path);
    if (obj.else) extractProperties(obj.else, path);
  }

  extractProperties(schema);

  function isAllowedVariable(value: string): boolean {
    // Validate is variable is valid against the parsed array of variables coming from the server
    const isValidFromServerResponse = !!result.variables.find((v) => v.label === value);

    if (isValidFromServerResponse) {
      return true;
    }

    // Handle array variables and validate them against the parsed array variables.
    // For example: steps.digest.events[1].payload.name is validated against steps.digest.events that is returned by the server
    const isValidFromArrayNameSpace = result.arrays.some((v) => value.startsWith(v.label));

    if (isValidFromArrayNameSpace) {
      return true;
    }

    // Handle variable for payload and subscriber.data namespace such as payload.name or subscriber.data.name
    const isValidFromNamespaceWithUnknownKeys = result.namespaces.some(
      (v) => value.startsWith(v.label) && value !== v.label
    );

    if (isValidFromNamespaceWithUnknownKeys) {
      return true;
    }

    return false;
  }

  return {
    ...result,
    variables: [...result.primitives, ...result.arrays],
    isAllowedVariable,
  };
}
