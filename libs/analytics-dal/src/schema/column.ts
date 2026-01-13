import { z } from 'zod';

export interface ColumnDef<T extends z.ZodTypeAny = z.ZodTypeAny> {
  zod: T;
  clickhouseType: string;
  isArray: boolean;
}

export const ch = {
  string: (defaultValue?: string): ColumnDef<z.ZodString> => ({
    zod: z.string(),
    clickhouseType: defaultValue !== undefined ? `String DEFAULT '${defaultValue}'` : 'String',
    isArray: false,
  }),

  datetime64: (precision = 3, tz = 'UTC'): ColumnDef<z.ZodDate> => ({
    zod: z.coerce.date(),
    clickhouseType: `DateTime64(${precision}, '${tz}')`,
    isArray: false,
  }),

  uint8: (defaultValue?: number): ColumnDef<z.ZodNumber> => ({
    zod: z.number().int().min(0).max(255),
    clickhouseType: defaultValue !== undefined ? `UInt8 DEFAULT ${defaultValue}` : 'UInt8',
    isArray: false,
  }),

  uint16: (): ColumnDef<z.ZodNumber> => ({
    zod: z.number().int().min(0).max(65535),
    clickhouseType: 'UInt16',
    isArray: false,
  }),

  uint32: (): ColumnDef<z.ZodNumber> => ({
    zod: z.number().int().min(0),
    clickhouseType: 'UInt32',
    isArray: false,
  }),

  boolean: (defaultValue?: boolean): ColumnDef<z.ZodBoolean> => ({
    zod: z.boolean(),
    clickhouseType: defaultValue !== undefined ? `Bool DEFAULT ${defaultValue}` : 'Bool',
    isArray: false,
  }),

  nullable: <T extends ColumnDef>(col: T): ColumnDef => ({
    zod: col.zod.nullable(),
    clickhouseType: `Nullable(${col.clickhouseType})`,
    isArray: col.isArray,
  }),

  lowCardinality: <T extends ColumnDef>(col: T): ColumnDef => ({
    ...col,
    clickhouseType: `LowCardinality(${col.clickhouseType})`,
  }),

  array: <T extends ColumnDef>(col: T, defaultValue: unknown[] = []): ColumnDef => ({
    zod: z.array(col.zod).default(defaultValue as never),
    clickhouseType: `Array(${col.clickhouseType})`,
    isArray: true,
  }),
};
