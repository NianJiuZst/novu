import { z } from 'zod';

/**
 * Simple Zod helpers for ClickHouse integration
 */

/**
 * Create standard ClickHouse transforms for data formatting
 */
export const ClickHouseTransforms = {
  /**
   * Transform Date to ClickHouse DateTime64 format
   */
  dateTime64: z.date().transform((date) => {
    const isoString = date.toISOString();
    return isoString.slice(0, -1) as unknown as Date;
  }),

  /**
   * Transform object to JSON string for ClickHouse
   */
  jsonString: z.unknown().transform((value) => {
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  }),

  /**
   * Transform boolean to ClickHouse string format
   */
  booleanString: z.boolean().transform((value) => (value ? 'true' : 'false')),

  /**
   * Transform array to ClickHouse-compatible format
   */
  arrayString: z.array(z.unknown()).transform((value) => JSON.stringify(value)),
};

/**
 * Create a Zod transformer for enum mapping with validation
 */
export function createEnumMapper<TInput extends string | number, TOutput extends string>(
  mappingConfig: Record<TInput, TOutput>,
  defaultValue?: TOutput
) {
  return z.union([z.string(), z.number()] as const).transform((value, ctx): TOutput => {
    const mappedValue = mappingConfig[value as TInput];

    if (mappedValue !== undefined) {
      return mappedValue;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Unknown enum value: ${value}. Valid values: ${Object.keys(mappingConfig).join(', ')}`,
    });

    return z.NEVER;
  });
}
