import { z } from 'zod';

// ---------------------------------------------------------------------------
// Core field shape
// ---------------------------------------------------------------------------

export type ZodChField = {
  zod: z.ZodTypeAny;
  ch: { _type: string };
};

export type ZodChSchema = Record<string, ZodChField>;

// Infers the TypeScript type of a row from a ZodChSchema
export type InferZodChSchema<T extends ZodChSchema> = {
  [K in keyof T]: z.infer<T[K]['zod']>;
};

// ---------------------------------------------------------------------------
// Primitive builders
// ---------------------------------------------------------------------------

export const chString = () => ({ _type: 'String' }) as const;

export const chUInt8 = () => ({ _type: 'UInt8' }) as const;

export const chUInt16 = () => ({ _type: 'UInt16' }) as const;

export const chUInt32 = () => ({ _type: 'UInt32' }) as const;

export const chUInt64 = () => ({ _type: 'UInt64' }) as const;

export const chFloat64 = () => ({ _type: 'Float64' }) as const;

export const chBoolean = () => ({ _type: 'Bool' }) as const;

export const chDate = () => ({ _type: 'Date' }) as const;

export const chDateTime64 = (precision: number, tz: string) =>
  ({ _type: `DateTime64(${precision}, '${tz}')` }) as { _type: string };

// ---------------------------------------------------------------------------
// Composite / wrapper builders
// ---------------------------------------------------------------------------

export const chLowCardinality = <T extends { _type: string }>(inner: T) =>
  ({ _type: `LowCardinality(${inner._type})` }) as { _type: string };

export const chNullable = <T extends { _type: string }>(inner: T) =>
  ({ _type: `Nullable(${inner._type})` }) as { _type: string };

export const chArray = <T extends { _type: string }>(inner: T) =>
  ({ _type: `Array(${inner._type})` }) as { _type: string };

export const chTuple = <T extends Record<string, { _type: string }>>(fields: T) => {
  const fieldStr = Object.entries(fields)
    .map(([name, type]) => `${name} ${type._type}`)
    .join(', ');

  return { _type: `Tuple(${fieldStr})` } as { _type: string };
};
