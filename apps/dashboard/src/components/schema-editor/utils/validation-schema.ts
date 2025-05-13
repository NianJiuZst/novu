import { z } from 'zod';
import { SCHEMA_TYPE_OPTIONS } from '../constants';
import type { SchemaProperty as OriginalSchemaProperty, SchemaValueType } from '../types';

const schemaValueTypesTuple = SCHEMA_TYPE_OPTIONS.map((option) => option.value) as [
  SchemaValueType,
  ...SchemaValueType[],
];
const schemaValueTypeEnum = z.enum(schemaValueTypesTuple);

// Define a TypeScript interface for the recursive structure.
interface RecursiveSchemaProperty extends Omit<OriginalSchemaProperty, 'children' | 'arrayItemSchema'> {
  children?: RecursiveSchemaProperty[];
  arrayItemSchema?: RecursiveSchemaProperty[];
}

// Zod schema implementing the recursive interface.
// The explicit type annotation on schemaPropertySchema helps TypeScript understand the recursion.
export const schemaPropertySchema: z.ZodType<RecursiveSchemaProperty> = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Property name cannot be empty' }),
  type: schemaValueTypeEnum,
  description: z.string().optional(),
  required: z.boolean().optional().default(false),
  format: z.string().optional(),
  pattern: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  defaultValue: z.any().optional(),
  enumValues: z.array(z.string().min(1, { message: 'Enum choice cannot be empty' })).optional(),
  children: z.array(z.lazy(() => schemaPropertySchema)).optional(), // Recursive call
  arrayItemType: schemaValueTypeEnum.optional().default('string'),
  arrayItemSchema: z.array(z.lazy(() => schemaPropertySchema)).optional(), // Recursive call
});

export const editorSchema = z
  .object({
    // Cast schemaPropertySchema to z.ZodTypeAny in z.array if direct usage causes issues with inference,
    // but ideally, it should work if schemaPropertySchema is correctly typed.
    schemaRows: z.array(schemaPropertySchema as z.ZodTypeAny), // Use the defined recursive schema
  })
  .superRefine((data, ctx) => {
    function checkUniqueNames(
      properties: RecursiveSchemaProperty[] | undefined | null, // Use RecursiveSchemaProperty here
      pathPrefix: string,
      parentType?: string
    ): void {
      if (!properties || properties.length === 0) return;
      const nameCounts = new Map<string, number[]>();
      properties.forEach((prop, index) => {
        if (typeof prop.name === 'string' && prop.name.trim() !== '') {
          const lowerName = prop.name.toLowerCase();

          if (!nameCounts.has(lowerName)) {
            nameCounts.set(lowerName, []);
          }

          nameCounts.get(lowerName)!.push(index);
        }

        if (prop.type === 'object' && prop.children && prop.children.length > 0) {
          checkUniqueNames(prop.children, `${pathPrefix}[${index}].children`, 'object');
        }

        if (
          prop.type === 'array' &&
          prop.arrayItemType === 'object' &&
          prop.arrayItemSchema &&
          prop.arrayItemSchema.length > 0
        ) {
          checkUniqueNames(prop.arrayItemSchema, `${pathPrefix}[${index}].arrayItemSchema`, 'arrayItem');
        }
      });
      nameCounts.forEach((indices) => {
        if (indices.length > 1) {
          indices.forEach((index) => {
            const propertyName = properties[index]?.name || '';
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Property name "${propertyName}" must be unique at this level.`,
              path: [`${pathPrefix}[${index}].name`],
            });
          });
        }
      });
    }

    // Ensure data.schemaRows aligns with RecursiveSchemaProperty[] if necessary for checkUniqueNames input
    checkUniqueNames(data.schemaRows as RecursiveSchemaProperty[] | undefined | null, 'schemaRows', 'root');
  });
