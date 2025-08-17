import { z } from 'zod';
import { ClickHouseColumnDefinition, ClickHouseTableOptions, parseClickHouseType } from './types';

/**
 * Native ClickHouse schema class that works with Zod schemas
 */
export class NativeClickHouseSchema<T extends z.ZodRawShape> {
  public readonly schema: z.ZodObject<T>;
  public readonly tableOptions: ClickHouseTableOptions;

  constructor(schema: z.ZodObject<T>, tableOptions: ClickHouseTableOptions) {
    this.schema = schema;
    this.tableOptions = tableOptions;
  }

  /**
   * Extract column definitions from Zod schema
   */
  public getColumnDefinitions(): ClickHouseColumnDefinition[] {
    const shape = this.schema.shape;
    const columns: ClickHouseColumnDefinition[] = [];

    for (const [fieldName, zodField] of Object.entries(shape)) {
      const column = this.extractColumnDefinition(fieldName, zodField as z.ZodTypeAny);
      if (column) {
        columns.push(column);
      }
    }

    return columns;
  }

  /**
   * Generate CREATE TABLE query
   */
  public getCreateTableQuery(): string {
    const columns = this.getColumnDefinitions();
    const columnDefinitions = columns
      .map((col) => `  ${col.name} ${col.type}${col.comment ? ` COMMENT '${col.comment}'` : ''}`)
      .join(',\n');

    let query = `CREATE TABLE IF NOT EXISTS ${this.tableOptions.table_name} (\n${columnDefinitions}\n)`;

    // Add engine
    query += `\nENGINE = ${this.tableOptions.engine}`;

    // Add ORDER BY
    if (this.tableOptions.order_by) {
      query += `\nORDER BY ${this.tableOptions.order_by}`;
    }

    // Add PARTITION BY
    if (this.tableOptions.partition_by) {
      query += `\nPARTITION BY ${this.tableOptions.partition_by}`;
    }

    // Add PRIMARY KEY
    if (this.tableOptions.primary_key) {
      query += `\nPRIMARY KEY ${this.tableOptions.primary_key}`;
    }

    // Add SAMPLE BY
    if (this.tableOptions.sample_by) {
      query += `\nSAMPLE BY ${this.tableOptions.sample_by}`;
    }

    // Add TTL
    if (this.tableOptions.ttl) {
      query += `\nTTL ${this.tableOptions.ttl}`;
    }

    // Add additional options
    if (this.tableOptions.additional_options && this.tableOptions.additional_options.length > 0) {
      query += `\n${this.tableOptions.additional_options.join('\n')}`;
    }

    // Add settings
    if (this.tableOptions.settings && Object.keys(this.tableOptions.settings).length > 0) {
      const settingsArray = Object.entries(this.tableOptions.settings).map(([key, value]) => `${key} = ${value}`);
      query += `\nSETTINGS ${settingsArray.join(', ')}`;
    }

    return query;
  }

  /**
   * Get table name
   */
  public get tableName(): string {
    return this.tableOptions.table_name;
  }

  /**
   * Extract column definition from Zod field
   */
  private extractColumnDefinition(fieldName: string, zodField: z.ZodTypeAny): ClickHouseColumnDefinition | null {
    const description = zodField.description;
    const clickhouseMetadata = parseClickHouseType(description);

    if (!clickhouseMetadata) {
      // Fallback to basic type mapping if no metadata
      return {
        name: fieldName,
        type: this.mapZodTypeToClickHouse(zodField),
        comment: `Auto-mapped from Zod type: ${zodField.constructor.name}`,
      };
    }

    return {
      name: fieldName,
      type: clickhouseMetadata.clickhouseType,
      nullable: clickhouseMetadata.nullable,
      lowCardinality: clickhouseMetadata.lowCardinality,
      defaultValue: clickhouseMetadata.defaultValue,
      comment: clickhouseMetadata.comment,
    };
  }

  /**
   * Fallback mapping from Zod types to ClickHouse types
   */
  private mapZodTypeToClickHouse(zodField: z.ZodTypeAny): string {
    const zodTypeName = zodField.constructor.name;

    switch (zodTypeName) {
      case 'ZodString':
        return 'String';
      case 'ZodNumber':
        return 'Float64';
      case 'ZodBoolean':
        return 'Boolean';
      case 'ZodDate':
        return "DateTime64(3, 'UTC')";
      case 'ZodArray':
        return 'Array(String)';
      case 'ZodOptional':
      case 'ZodNullable': {
        const innerField = (zodField as z.ZodOptional<z.ZodTypeAny> | z.ZodNullable<z.ZodTypeAny>)._def?.innerType;
        if (innerField) {
          return `Nullable(${this.mapZodTypeToClickHouse(innerField)})`;
        }
        return 'Nullable(String)';
      }
      default:
        return 'String';
    }
  }
}

/**
 * Helper function to create a new ClickHouse schema
 */
export function createClickHouseSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  tableOptions: ClickHouseTableOptions
): NativeClickHouseSchema<T> {
  return new NativeClickHouseSchema(schema, tableOptions);
}

/**
 * Type helper to infer TypeScript type from ClickHouse schema
 */
export type InferClickHouseSchema<T extends NativeClickHouseSchema<z.ZodRawShape>> = T extends NativeClickHouseSchema<
  infer R
>
  ? z.infer<z.ZodObject<R>>
  : never;
