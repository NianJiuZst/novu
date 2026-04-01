import { FeatureFlagsKeysEnum } from '@novu/shared';
import { addDays } from 'date-fns';
import { PinoLogger } from 'nestjs-pino';
import { generateObjectId } from '../../../utils/generate-id';
import { Prettify } from '../../../utils/prettify.type';
import { FeatureFlagsService } from '../../feature-flags/feature-flags.service';
import { ClickHouseService, InsertOptions } from '../clickhouse.service';
import { ClickHouseBatchService } from '../clickhouse-batch.service';
import { InferZodChSchema, ZodChSchema } from './clickhouse-types';

// ---------------------------------------------------------------------------
// Operator types (identical to v1)
// ---------------------------------------------------------------------------

const CLICKHOUSE_OPERATORS = [
  '=',
  '==',
  '!=',
  '<>',
  '<=',
  '>=',
  '<',
  '>',
  'LIKE',
  'NOT LIKE',
  'ILIKE',
  'IN',
  'NOT IN',
  'GLOBAL IN',
  'GLOBAL NOT IN',
  'IS NULL',
  'IS NOT NULL',
  'has',
  'hasAny',
  'hasAll',
] as const;

type ArrayOperators = 'IN' | 'NOT IN' | 'GLOBAL IN' | 'GLOBAL NOT IN' | 'hasAny' | 'hasAll';
type NullOperators = 'IS NULL' | 'IS NOT NULL';

export type ClickhouseOperator = (typeof CLICKHOUSE_OPERATORS)[number];
export const ALLOWED_OPERATORS: readonly ClickhouseOperator[] = CLICKHOUSE_OPERATORS;

const LIMIT_MAX_THRESHOLD = 1000;
export const ORDER_DIRECTION = ['ASC', 'DESC'];

export type OrCondition<T> = {
  $or: WhereCondition<T>[];
};

export type EnforcedContext = {
  environmentId: string;
};

type ConditionValue<T, K extends keyof T, O extends ClickhouseOperator> = O extends NullOperators
  ? never
  : O extends ArrayOperators
    ? T[K][]
    : T[K];

export type FieldCondition<T, K extends keyof T, O extends ClickhouseOperator> = O extends NullOperators
  ? {
      field: K;
      operator: O;
    }
  : {
      field: K;
      operator: O;
      value: ConditionValue<T, K, O>;
    };

type WhereCondition<T> = FieldCondition<T, keyof T, ClickhouseOperator> | OrCondition<T>;

export interface EnforcedWhere<T> {
  enforced: EnforcedContext;
  conditions?: WhereCondition<T>[];
}

export interface UnsafeWhere<T> {
  conditions: WhereCondition<T>[];
  __unsafe: true;
}

export type Where<T> = EnforcedWhere<T> | UnsafeWhere<T>;

export type SchemaKeys<T extends ZodChSchema> = keyof InferZodChSchema<T>;

// ---------------------------------------------------------------------------
// Base repository
// ---------------------------------------------------------------------------

export abstract class LogRepositoryV2<TSchema extends ZodChSchema> {
  readonly table: string;
  readonly identifierPrefix: string;

  constructor(
    protected readonly clickhouseService: ClickHouseService,
    protected readonly logger: PinoLogger,
    protected readonly schema: TSchema,
    protected readonly schemaOrderBy: SchemaKeys<TSchema>[],
    protected readonly featureFlagsService: FeatureFlagsService,
    protected readonly batchService?: ClickHouseBatchService
  ) {}

  private getColumnType(column: string): string {
    return this.schema[column]?.ch._type ?? 'String';
  }

  private isArrayColumn(column: string): boolean {
    return this.getColumnType(column).startsWith('Array(');
  }

  private validateColumnName(columnName: SchemaKeys<TSchema>): void {
    if (!columnName || typeof columnName !== 'string') {
      throw new Error('Invalid column name: must be a non-empty string');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(columnName)) {
      throw new Error(`Invalid column name format: ${columnName}`);
    }

    if (!this.schema[columnName]) {
      throw new Error(`Column '${columnName}' does not exist in schema`);
    }
  }

  private validateOperator(operator: ClickhouseOperator): void {
    if (!ALLOWED_OPERATORS.includes(operator)) {
      throw new Error(`Invalid operator: ${operator}. Allowed operators: ${ALLOWED_OPERATORS.join(', ')}`);
    }
  }

  protected async getExpirationDate(context?: {
    organizationId?: string;
    environmentId?: string;
    userId?: string;
  }): Promise<Date> {
    try {
      const expirationDays = await this.featureFlagsService.getFlag({
        key: FeatureFlagsKeysEnum.LOG_EXPIRATION_DAYS_NUMBER,
        defaultValue: 100,
        organization: context?.organizationId ? { _id: context.organizationId } : undefined,
        environment: context?.environmentId ? { _id: context.environmentId } : undefined,
        user: context?.userId ? { _id: context.userId } : undefined,
      });

      return addDays(new Date(), expirationDays);
    } catch (error) {
      this.logger.warn(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to fetch log expiration days from LaunchDarkly, falling back to 100 days'
      );

      return addDays(new Date(), 100);
    }
  }

  protected buildWhereClause(where: Where<InferZodChSchema<TSchema>>): {
    clause: string;
    params: Record<string, unknown>;
  } {
    let allConditions: WhereCondition<InferZodChSchema<TSchema>>[] = [];

    if ('__unsafe' in where) {
      this.logger.warn(
        {
          table: this.table,
          conditionsCount: where.conditions.length,
        },
        'Using unsafe WHERE clause without tenant enforcement'
      );
      allConditions = where.conditions;
    } else {
      const enforcedConditions = this.buildEnforcedConditions(where.enforced);
      allConditions = [...enforcedConditions, ...(where.conditions || [])];
    }

    return this.buildWhereClauseFromConditions(allConditions);
  }

  private buildEnforcedConditions(enforced: EnforcedContext): WhereCondition<InferZodChSchema<TSchema>>[] {
    return [
      {
        field: 'environment_id' as keyof InferZodChSchema<TSchema>,
        operator: '=' as const,
        value: enforced.environmentId,
      },
    ];
  }

  private buildWhereClauseFromConditions(conditions: WhereCondition<InferZodChSchema<TSchema>>[]): {
    clause: string;
    params: Record<string, unknown>;
  } {
    const params: Record<string, unknown> = {};
    let paramIndex = 0;

    const buildSingleCondition = (condition: WhereCondition<InferZodChSchema<TSchema>>): string => {
      if ('$or' in condition) {
        if (!Array.isArray(condition.$or)) {
          throw new Error('$or condition must contain an array of conditions');
        }

        const orClauses = condition.$or.map((orCondition) => buildSingleCondition(orCondition));

        return `(${orClauses.join(' OR ')})`;
      }

      if (!('field' in condition) || !('operator' in condition)) {
        throw new Error('Each condition must have field and operator properties');
      }

      const { field, operator } = condition;
      const value = 'value' in condition ? condition.value : undefined;
      this.validateColumnName(field as SchemaKeys<TSchema>);
      this.validateOperator(operator);

      const nullOperators: NullOperators[] = ['IS NULL', 'IS NOT NULL'];
      if (nullOperators.includes(operator as NullOperators)) {
        return `${String(field)} ${operator}`;
      }

      if (!nullOperators.includes(operator as NullOperators) && (value === null || value === undefined)) {
        throw new Error(`Invalid value for column '${String(field)}': value cannot be null or undefined`);
      }

      const paramName = `param_${paramIndex}_${String(field).replace(/[^a-zA-Z0-9]/g, '')}`;
      paramIndex++;
      params[paramName] = value;

      let paramType = this.getColumnType(String(field));
      const arrayOperators: ArrayOperators[] = ['IN', 'NOT IN', 'GLOBAL IN', 'GLOBAL NOT IN', 'hasAny', 'hasAll'];
      const arrayFunctionOperators = ['has', 'hasAny', 'hasAll'];

      if (arrayOperators.includes(operator as ArrayOperators) && Array.isArray(value)) {
        if (!this.isArrayColumn(String(field))) {
          paramType = `Array(${paramType})`;
        }
      }

      if (arrayFunctionOperators.includes(operator)) {
        return `${operator}(${String(field)}, {${paramName}:${paramType}})`;
      }

      return `${String(field)} ${operator} {${paramName}:${paramType}}`;
    };

    const clauses = conditions.map((condition) => buildSingleCondition(condition)).join(' AND ');

    return { clause: clauses ? `WHERE ${clauses}` : '', params };
  }

  protected async insert(
    data: Omit<InferZodChSchema<TSchema>, 'id' | 'expires_at'> & { id?: string },
    context: {
      organizationId?: string;
      environmentId?: string;
      userId?: string;
    },
    options: InsertOptions
  ): Promise<void> {
    const id: string = (data as { id?: string })?.id || `${this.identifierPrefix}${generateObjectId()}`;
    const expirationDate = await this.getExpirationDate(context);
    const expiresAt = LogRepositoryV2.formatDateTime64(expirationDate);

    const row = { ...data, id, expires_at: expiresAt };

    const shouldUseBatching = await this.shouldUseBatching(context);

    if (shouldUseBatching && this.batchService) {
      const batchConfig = this.getBatchConfig();
      this.batchService.add(this.table, row, {
        maxBatchSize: batchConfig.maxBatchSize,
        flushIntervalMs: batchConfig.flushIntervalMs,
        insertOptions: options,
      });
    } else {
      await this.clickhouseService.insert(this.table, [row], options);
    }
  }

  protected async shouldUseBatching(context: {
    organizationId?: string;
    environmentId?: string;
    userId?: string;
  }): Promise<boolean> {
    if (!this.batchService || !this.clickhouseService.client) {
      return false;
    }

    try {
      const isBatchingEnabled = await this.featureFlagsService.getFlag({
        key: FeatureFlagsKeysEnum.IS_CLICKHOUSE_BATCHING_ENABLED,
        defaultValue: false,
        organization: context.organizationId ? { _id: context.organizationId } : undefined,
        environment: context.environmentId ? { _id: context.environmentId } : undefined,
        user: context.userId ? { _id: context.userId } : undefined,
      });

      return isBatchingEnabled;
    } catch (error) {
      this.logger.warn(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          table: this.table,
        },
        'Failed to check batching feature flag, falling back to direct insert'
      );

      return false;
    }
  }

  protected getBatchConfig(): { maxBatchSize: number; flushIntervalMs: number } {
    const tableName = this.table.toUpperCase();
    const defaultMaxBatchSize = 500;
    const defaultFlushIntervalMs = 3000;

    const maxBatchSizeEnv = process.env[`${tableName}_BATCH_SIZE`];
    const parsedMaxBatchSize = maxBatchSizeEnv ? parseInt(maxBatchSizeEnv, 10) : defaultMaxBatchSize;
    const maxBatchSize =
      Number.isFinite(parsedMaxBatchSize) && parsedMaxBatchSize > 0 ? parsedMaxBatchSize : defaultMaxBatchSize;

    const flushIntervalMsEnv = process.env[`${tableName}_FLUSH_INTERVAL_MS`];
    const parsedFlushIntervalMs = flushIntervalMsEnv ? parseInt(flushIntervalMsEnv, 10) : defaultFlushIntervalMs;
    const flushIntervalMs =
      Number.isFinite(parsedFlushIntervalMs) && parsedFlushIntervalMs > 0
        ? parsedFlushIntervalMs
        : defaultFlushIntervalMs;

    return { maxBatchSize, flushIntervalMs };
  }

  protected async insertMany(
    data: Omit<InferZodChSchema<TSchema>, 'id' | 'expires_at'>[],
    context: {
      organizationId?: string;
      environmentId?: string;
      userId?: string;
    },
    options: InsertOptions
  ): Promise<void> {
    const ids = data.map((_item) => `${this.identifierPrefix}${generateObjectId()}`);
    const expirationDate = await this.getExpirationDate(context);
    const expiresAt = LogRepositoryV2.formatDateTime64(expirationDate);

    const rows = data.map((item, index) => ({ ...item, id: ids[index], expires_at: expiresAt }));

    const shouldUseBatching = await this.shouldUseBatching(context);

    if (shouldUseBatching && this.batchService) {
      const batchConfig = this.getBatchConfig();
      for (const row of rows) {
        this.batchService.add(this.table, row, {
          maxBatchSize: batchConfig.maxBatchSize,
          flushIntervalMs: batchConfig.flushIntervalMs,
          insertOptions: options,
        });
      }
    } else {
      await this.clickhouseService.insert(this.table, rows, options);
    }
  }

  // Overload for column array selection
  async find<T extends readonly (keyof InferZodChSchema<TSchema>)[]>(options: {
    where: Where<InferZodChSchema<TSchema>>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: T;
  }): Promise<{
    data: Prettify<Pick<InferZodChSchema<TSchema>, T[number]>>[];
    rows: number;
  }>;

  // Overload for "*" all columns selection
  async find(options: {
    where: Where<InferZodChSchema<TSchema>>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: '*';
  }): Promise<{
    data: InferZodChSchema<TSchema>[];
    rows: number;
  }>;

  // Implementation
  async find<T extends readonly (keyof InferZodChSchema<TSchema>)[] | '*'>(options: {
    where: Where<InferZodChSchema<TSchema>>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: T;
  }): Promise<{
    data:
      | InferZodChSchema<TSchema>[]
      | Prettify<
          Pick<InferZodChSchema<TSchema>, T extends readonly (keyof InferZodChSchema<TSchema>)[] ? T[number] : never>
        >[];
    rows: number;
  }> {
    const { where, limit = 100, offset = 0, orderBy, orderDirection = 'DESC', useFinal = false, select } = options;

    if (limit < 0 || limit > LIMIT_MAX_THRESHOLD) {
      throw new Error(`Limit must be between 0 and ${LIMIT_MAX_THRESHOLD}`);
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    const { clause, params } = this.buildWhereClause(where);

    if (orderBy) {
      this.validateColumnName(String(orderBy) as SchemaKeys<TSchema>);

      if (!this.schemaOrderBy.includes(orderBy)) {
        this.logger.warn(
          {
            orderBy,
            schemaOrderBy: this.schemaOrderBy,
          },
          `Column '${orderBy as string}' cannot be used for ordering. Available columns: ${this.schemaOrderBy.join(', ')}`
        );
      }
    }

    if (orderDirection && !ORDER_DIRECTION.includes(orderDirection)) {
      throw new Error(`Invalid order direction: ${orderDirection}. Allowed directions: ${ORDER_DIRECTION.join(', ')}`);
    }

    const selectClause = select === '*' ? '*' : (select as readonly string[]).join(', ');
    const finalModifier = useFinal ? ' FINAL' : '';
    const query = `
      SELECT ${selectClause}
      FROM ${this.table}${finalModifier}
      ${clause}
      ${orderBy ? `ORDER BY ${String(orderBy)} ${orderDirection}` : ''}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const result = await this.clickhouseService.query({
      query,
      params,
    });

    return result as {
      data:
        | InferZodChSchema<TSchema>[]
        | Pick<InferZodChSchema<TSchema>, T extends readonly (keyof InferZodChSchema<TSchema>)[] ? T[number] : never>[];
      rows: number;
    };
  }

  // Overload for column array selection
  async findOne<T extends readonly (keyof InferZodChSchema<TSchema>)[]>(options: {
    where: Where<InferZodChSchema<TSchema>>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: T;
  }): Promise<{
    data: Pick<InferZodChSchema<TSchema>, T[number]>;
    rows: number;
  }>;

  // Overload for "*" all columns selection
  async findOne(options: {
    where: Where<InferZodChSchema<TSchema>>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: '*';
  }): Promise<{
    data: InferZodChSchema<TSchema>;
    rows: number;
  }>;

  // Implementation
  async findOne<T extends readonly (keyof InferZodChSchema<TSchema>)[] | '*'>(options: {
    where: Where<InferZodChSchema<TSchema>>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: T;
  }): Promise<{
    data:
      | InferZodChSchema<TSchema>
      | Pick<InferZodChSchema<TSchema>, T extends readonly (keyof InferZodChSchema<TSchema>)[] ? T[number] : never>;
    rows: number;
  }> {
    if (options.select === '*') {
      const result = await this.find({
        ...options,
        limit: 1,
        select: '*',
      });

      return { data: result.data[0], rows: result.rows };
    }

    const result = await this.find({
      ...options,
      limit: 1,
      select: options.select as T extends readonly (keyof InferZodChSchema<TSchema>)[] ? T : never,
    });

    return { data: result.data[0], rows: result.rows };
  }

  async count(options: { where: Where<InferZodChSchema<TSchema>>; useFinal?: boolean }): Promise<number> {
    const { where, useFinal = false } = options;
    const finalModifier = useFinal ? ' FINAL' : '';

    const { clause, params } = this.buildWhereClause(where);

    const query = `
      SELECT toInt64(count()) as total
      FROM ${this.table}${finalModifier}
      ${clause}
    `;

    const result = await this.clickhouseService.query<{ total: number | string }>({
      query,
      params,
    });

    const total = result.data[0]?.total;

    return Number(total || 0);
  }

  static formatDateTime64(date: Date) {
    const isoString = date.toISOString();

    return isoString.slice(0, -1) as unknown as Date;
  }
}

// ---------------------------------------------------------------------------
// QueryBuilder (ported verbatim from v1, generic constraint updated)
// ---------------------------------------------------------------------------

export class QueryBuilder<T> {
  private conditions: WhereCondition<T>[] = [];

  constructor(private enforced: EnforcedContext) {}

  where<K extends keyof T, O extends ClickhouseOperator>(
    field: K,
    operator: O,
    value: O extends ArrayOperators ? T[K][] : T[K]
  ): this {
    this.conditions.push({ field, operator, value } as WhereCondition<T>);

    return this;
  }

  whereEquals<K extends keyof T>(field: K, value: T[K]): this {
    return this.where(field, '=', value);
  }

  whereIn<K extends keyof T>(field: K, values: T[K][]): this {
    return this.where(field, 'IN', values);
  }

  whereNotIn<K extends keyof T>(field: K, values: T[K][]): this {
    return this.where(field, 'NOT IN', values);
  }

  whereLike<K extends keyof T>(field: K, value: T[K]): this {
    return this.where(field, 'LIKE', value);
  }

  whereGreaterThan<K extends keyof T>(field: K, value: T[K]): this {
    return this.where(field, '>', value);
  }

  whereGreaterThanOrEqual<K extends keyof T>(field: K, value: T[K]): this {
    return this.where(field, '>=', value);
  }

  whereLessThan<K extends keyof T>(field: K, value: T[K]): this {
    return this.where(field, '<', value);
  }

  whereLessThanOrEqual<K extends keyof T>(field: K, value: T[K]): this {
    return this.where(field, '<=', value);
  }

  whereBetween<K extends keyof T>(field: K, min: T[K], max: T[K]): this {
    this.where(field, '>=', min);
    this.where(field, '<=', max);

    return this;
  }

  whereHas<K extends keyof T>(field: K, value: T[K] extends readonly (infer U)[] ? U : T[K]): this {
    return this.where(field, 'has', value as T[K]);
  }

  whereHasAny<K extends keyof T>(field: K, values: T[K]): this {
    // biome-ignore lint/suspicious/noExplicitAny: array field T[K] is already an array type, cast needed for operator overload
    return this.where(field, 'hasAny', values as any);
  }

  whereHasAll<K extends keyof T>(field: K, values: T[K]): this {
    // biome-ignore lint/suspicious/noExplicitAny: array field T[K] is already an array type, cast needed for operator overload
    return this.where(field, 'hasAll', values as any);
  }

  or(callback: (builder: Omit<QueryBuilder<T>, 'build' | 'or'>) => void): this {
    const orBuilder = new QueryBuilder<T>(this.enforced);
    callback(orBuilder);

    if (orBuilder.conditions.length > 0) {
      const orCondition: OrCondition<T> = {
        $or: orBuilder.conditions,
      };
      this.conditions.push(orCondition);
    }

    return this;
  }

  orWhere(orConditions: Array<FieldCondition<T, keyof T, ClickhouseOperator>>): this {
    if (orConditions.length > 0) {
      const conditions: WhereCondition<T>[] = orConditions.map((condition) =>
        'value' in condition
          ? ({
              field: condition.field,
              operator: condition.operator,
              value: condition.value,
            } as WhereCondition<T>)
          : ({
              field: condition.field,
              operator: condition.operator,
            } as WhereCondition<T>)
      );

      const orCondition: OrCondition<T> = {
        $or: conditions,
      };
      this.conditions.push(orCondition);
    }

    return this;
  }

  build(): EnforcedWhere<T> {
    return {
      enforced: this.enforced,
      conditions: this.conditions,
    };
  }
}
