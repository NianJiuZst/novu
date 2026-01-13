import { z } from 'zod';
import type { ColumnDef } from './column';

type SchemaDefinition = Record<string, ColumnDef>;

interface TableConfig<T extends SchemaDefinition> {
  tableName: string;
  orderBy: (keyof T)[];
  ttlColumn?: keyof T;
}

type BuildZodShape<T extends SchemaDefinition> = {
  [K in keyof T]: T[K]['zod'];
};

export class ClickHouseSchema<T extends SchemaDefinition> {
  readonly tableName: string;
  readonly columns: T;
  readonly orderBy: (keyof T)[];
  readonly zodSchema: z.ZodObject<BuildZodShape<T>>;

  constructor(columns: T, config: TableConfig<T>) {
    this.tableName = config.tableName;
    this.columns = columns;
    this.orderBy = config.orderBy;

    const shape = {} as BuildZodShape<T>;
    for (const key of Object.keys(columns) as (keyof T)[]) {
      const column = columns[key];
      if (column) {
        shape[key] = column.zod as BuildZodShape<T>[typeof key];
      }
    }
    this.zodSchema = z.object(shape);
  }

  getColumnType(column: keyof T): string {
    const col = this.columns[column];
    if (!col) throw new Error(`Column ${String(column)} not found`);

    return col.clickhouseType;
  }

  isArrayColumn(column: keyof T): boolean {
    const col = this.columns[column];
    if (!col) return false;

    return col.isArray;
  }

  hasColumn(column: string): column is keyof T & string {
    return column in this.columns;
  }
}

export type InferSchemaType<S extends ClickHouseSchema<any>> = z.infer<S['zodSchema']>;
