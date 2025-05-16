import { z } from 'zod';
import type { JSONSchema7 } from '../json-schema'; // Import our JSONSchema7 type

// Basic Zod schema for JSONSchema7. This is not exhaustive but covers core structure.
// For full validation, a dedicated JSON Schema validator like AJV would be typically used.
const baseJsonSchema: z.ZodType<JSONSchema7> = z.lazy(() =>
  z
    .object({
      // Core Keywords
      $id: z.string().url().optional(),
      $schema: z.string().url().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      default: z.any().optional(),
      examples: z.array(z.any()).optional(),
      deprecated: z.boolean().optional(),
      readOnly: z.boolean().optional(),
      writeOnly: z.boolean().optional(),

      // Type-specific Keywords
      type: z
        .union([
          z.literal('string'),
          z.literal('number'),
          z.literal('integer'),
          z.literal('object'),
          z.literal('array'),
          z.literal('boolean'),
          z.literal('null'),
          // Support for array of types, e.g. ['string', 'null']
          z.array(z.enum(['string', 'number', 'integer', 'object', 'array', 'boolean', 'null'])).min(1),
        ])
        .optional(),

      // String specific
      minLength: z.number().int().nonnegative().optional(),
      maxLength: z.number().int().nonnegative().optional(),
      pattern: z.string().optional(), // Should be a valid regex
      format: z.string().optional(), // date-time, email, etc.

      // Number/Integer specific
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      exclusiveMinimum: z.number().optional(),
      exclusiveMaximum: z.number().optional(),
      multipleOf: z.number().positive().optional(),

      // Object specific
      properties: z
        .record(baseJsonSchema)
        .optional()
        .superRefine((properties, ctx) => {
          if (!properties) return true;
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

          for (const key in properties) {
            if (!Object.prototype.hasOwnProperty.call(properties, key)) continue;

            const propertySchema = properties[key];

            // Validation 1: Key itself cannot be an empty string AFTER a rename attempt
            if (key.trim() === '') {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Property name cannot be empty.',
                path: [key], // Error associated with the property object at this (empty) key
              });
            }

            // Validation 2: If key is a UUID (placeholder for a new property)
            // and its schema is basic (e.g., no title/description), it needs to be properly named.
            if (uuidPattern.test(key) && propertySchema && !propertySchema.title && !propertySchema.description) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'New property must be named.', // Specific message
                path: [key], // Error associated with the property object at this UUID key
              });
            }

            // Add other key validations here if needed, e.g. regex for valid characters if not handled by rename logic
            // For example, if a key is not empty, not a UUID, but contains invalid characters:
            // else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
            //   ctx.addIssue({
            //     code: z.ZodIssueCode.custom,
            //     message: 'Property name contains invalid characters.',
            //     path: [key],
            //   });
            // }
          }
        }),
      required: z.array(z.string()).optional(),
      additionalProperties: z.union([z.boolean(), baseJsonSchema]).optional(),
      minProperties: z.number().int().nonnegative().optional(),
      maxProperties: z.number().int().nonnegative().optional(),
      patternProperties: z.record(baseJsonSchema).optional(),

      // Array specific
      items: z.union([baseJsonSchema, z.array(baseJsonSchema)]).optional(),
      contains: baseJsonSchema.optional(),
      minItems: z.number().int().nonnegative().optional(),
      maxItems: z.number().int().nonnegative().optional(),
      uniqueItems: z.boolean().optional(),

      // Enum
      enum: z.array(z.string().min(1, { message: 'Enum choice value cannot be empty.' })).optional(), // Updated for non-empty string enums

      // Conditional Schemas
      if: baseJsonSchema.optional(),
      then: baseJsonSchema.optional(),
      else: baseJsonSchema.optional(),
      allOf: z.array(baseJsonSchema).optional(),
      anyOf: z.array(baseJsonSchema).optional(),
      oneOf: z.array(baseJsonSchema).optional(),
      not: baseJsonSchema.optional(),

      // Definitions (reusable schemas)
      definitions: z.record(baseJsonSchema).optional(),
      $defs: z.record(baseJsonSchema).optional(), // newer draft

      // Reference
      $ref: z.string().optional(),

      // Comments
      $comment: z.string().optional(),
    })
    // Allow any other properties (custom keywords, etc.)
    .catchall(z.any())
);

export const editorSchema = z.object({
  schema: baseJsonSchema.refine((schema) => schema.type === 'object' || (!schema.type && !!schema.properties), {
    message: "Root schema must be of type 'object' or implicitly an object with properties.",
    path: ['type'], // Path to the 'type' field of the root schema object
  }),
});
