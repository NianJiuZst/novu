/**
 * Native ClickHouse data types and utilities for schema definition
 */

export type ClickHouseDataType =
  | 'String'
  | 'FixedString'
  | 'UInt8'
  | 'UInt16'
  | 'UInt32'
  | 'UInt64'
  | 'Int8'
  | 'Int16'
  | 'Int32'
  | 'Int64'
  | 'Float32'
  | 'Float64'
  | 'Decimal'
  | 'Boolean'
  | 'UUID'
  | 'Date'
  | 'Date32'
  | 'DateTime'
  | 'DateTime64'
  | 'Enum8'
  | 'Enum16'
  | 'Array'
  | 'Tuple'
  | 'Map'
  | 'Nested'
  | 'Nothing'
  | 'Nullable'
  | 'LowCardinality';

export type ClickHouseEngine =
  | 'MergeTree'
  | 'ReplacingMergeTree'
  | 'SummingMergeTree'
  | 'AggregatingMergeTree'
  | 'CollapsingMergeTree'
  | 'VersionedCollapsingMergeTree'
  | 'GraphiteMergeTree';

export interface ClickHouseTableOptions {
  table_name: string;
  engine: string;
  order_by: string;
  partition_by?: string;
  primary_key?: string;
  sample_by?: string;
  ttl?: string;
  settings?: Record<string, unknown>;
  additional_options?: string[];
}

export interface ClickHouseColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  lowCardinality?: boolean;
  defaultValue?: string;
  comment?: string;
}

/**
 * Metadata stored in Zod schema descriptions to define ClickHouse types
 */
export interface ClickHouseTypeMetadata {
  clickhouseType: string;
  nullable?: boolean;
  lowCardinality?: boolean;
  defaultValue?: string;
  comment?: string;
}

/**
 * Helper functions to create ClickHouse type descriptions for Zod schemas
 */
export const ClickHouseTypes = {
  String: (defaultValue?: string): string => {
    const metadata: ClickHouseTypeMetadata = {
      clickhouseType: 'String',
      ...(defaultValue && { defaultValue }),
    };
    return JSON.stringify(metadata);
  },

  FixedString: (length: number): string => {
    const metadata: ClickHouseTypeMetadata = {
      clickhouseType: `FixedString(${length})`,
    };
    return JSON.stringify(metadata);
  },

  UInt8: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'UInt8' };
    return JSON.stringify(metadata);
  },

  UInt16: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'UInt16' };
    return JSON.stringify(metadata);
  },

  UInt32: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'UInt32' };
    return JSON.stringify(metadata);
  },

  UInt64: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'UInt64' };
    return JSON.stringify(metadata);
  },

  Int8: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Int8' };
    return JSON.stringify(metadata);
  },

  Int16: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Int16' };
    return JSON.stringify(metadata);
  },

  Int32: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Int32' };
    return JSON.stringify(metadata);
  },

  Int64: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Int64' };
    return JSON.stringify(metadata);
  },

  Float32: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Float32' };
    return JSON.stringify(metadata);
  },

  Float64: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Float64' };
    return JSON.stringify(metadata);
  },

  Boolean: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Boolean' };
    return JSON.stringify(metadata);
  },

  Date: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Date' };
    return JSON.stringify(metadata);
  },

  Date32: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'Date32' };
    return JSON.stringify(metadata);
  },

  DateTime: (timezone?: string): string => {
    const type = timezone ? `DateTime('${timezone}')` : 'DateTime';
    const metadata: ClickHouseTypeMetadata = { clickhouseType: type };
    return JSON.stringify(metadata);
  },

  DateTime64: (precision: number = 3, timezone: string = 'UTC'): string => {
    const metadata: ClickHouseTypeMetadata = {
      clickhouseType: `DateTime64(${precision}, '${timezone}')`,
    };
    return JSON.stringify(metadata);
  },

  UUID: (): string => {
    const metadata: ClickHouseTypeMetadata = { clickhouseType: 'UUID' };
    return JSON.stringify(metadata);
  },

  Enum8: (values: Record<string, number>): string => {
    const enumValues = Object.entries(values)
      .map(([key, value]) => `'${key}' = ${value}`)
      .join(', ');
    const metadata: ClickHouseTypeMetadata = {
      clickhouseType: `Enum8(${enumValues})`,
    };
    return JSON.stringify(metadata);
  },

  Enum16: (values: Record<string, number>): string => {
    const enumValues = Object.entries(values)
      .map(([key, value]) => `'${key}' = ${value}`)
      .join(', ');
    const metadata: ClickHouseTypeMetadata = {
      clickhouseType: `Enum16(${enumValues})`,
    };
    return JSON.stringify(metadata);
  },

  Array: (itemType: string): string => {
    const metadata: ClickHouseTypeMetadata = {
      clickhouseType: `Array(${itemType})`,
    };
    return JSON.stringify(metadata);
  },

  Nullable: (innerType: string): string => {
    try {
      const innerMetadata: ClickHouseTypeMetadata = JSON.parse(innerType);
      const metadata: ClickHouseTypeMetadata = {
        clickhouseType: `Nullable(${innerMetadata.clickhouseType})`,
        nullable: true,
      };
      return JSON.stringify(metadata);
    } catch {
      // Fallback for simple string types
      const metadata: ClickHouseTypeMetadata = {
        clickhouseType: `Nullable(${innerType})`,
        nullable: true,
      };
      return JSON.stringify(metadata);
    }
  },

  LowCardinality: (innerType: string): string => {
    try {
      const innerMetadata: ClickHouseTypeMetadata = JSON.parse(innerType);
      const metadata: ClickHouseTypeMetadata = {
        clickhouseType: `LowCardinality(${innerMetadata.clickhouseType})`,
        lowCardinality: true,
      };
      return JSON.stringify(metadata);
    } catch {
      // Fallback for simple string types
      const metadata: ClickHouseTypeMetadata = {
        clickhouseType: `LowCardinality(${innerType})`,
        lowCardinality: true,
      };
      return JSON.stringify(metadata);
    }
  },
};

/**
 * Helper function to parse ClickHouse type metadata from Zod description
 */
export function parseClickHouseType(description?: string): ClickHouseTypeMetadata | null {
  if (!description) return null;

  try {
    return JSON.parse(description) as ClickHouseTypeMetadata;
  } catch {
    return null;
  }
}
