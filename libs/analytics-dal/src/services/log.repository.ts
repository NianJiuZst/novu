import { FeatureFlagsService } from '@novu/application-generic';
import { FeatureFlagsKeysEnum } from '@novu/shared';
import { ClickhouseSchema, InferClickhouseSchemaType } from 'clickhouse-schema';
import { addDays } from 'date-fns';
import { PinoLogger } from 'nestjs-pino';
import { generateObjectId } from '../utils/generate-id';
import { Prettify } from '../utils/prettify.type';
import { ClickHouseService, InsertOptions } from './clickhouse.service';

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

// biome-ignore lint/suspicious/noExplicitAny: ChSchemaDefinition is not exported from clickhouse-schema package
export type SchemaKeys<T extends ClickhouseSchema<any>> = keyof InferClickhouseSchemaType<T>;

// biome-ignore lint/suspicious/noExplicitAny: ChSchemaDefinition is not exported from clickhouse-schema package
export abstract class LogRepository<TSchema extends ClickhouseSchema<any>, TEnhancedType> {
  readonly table: string;
  readonly identifierPrefix: string;

  constructor(
    protected readonly clickhouseService: ClickHouseService,
    protected readonly logger: PinoLogger,
    protected readonly schema: TSchema,
    protected readonly schemaOrderBy: SchemaKeys<TSchema>[],
    protected readonly featureFlagsService: FeatureFlagsService
  ) {}

  private getColumnType(column: string): string {
    return this.schema.schema[column]?.type?.toString() || 'String';
  }

  private isArrayColumn(column: string): boolean {
    const typeString = this.getColumnType(column);
    return typeString.startsWith('Array(');
  }

  private validateColumnName(columnName: SchemaKeys<TSchema>): void {
    if (!columnName || typeof columnName !== 'string') {
      throw new Error('Invalid column name: must be a non-empty string');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(columnName)) {
      throw new Error(`Invalid column name format: ${columnName}`);
    }

    if (!this.schema.schema[columnName]) {
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
    const DEFAULT_EXPIRATION_DAYS = 100;

    try {
      const hasContext = context?.organizationId || context?.environmentId || context?.userId;
      if (!hasContext) {
        return addDays(new Date(), DEFAULT_EXPIRATION_DAYS);
      }

      const flagContext = {
        key: FeatureFlagsKeysEnum.LOG_EXPIRATION_DAYS_NUMBER,
        defaultValue: DEFAULT_EXPIRATION_DAYS,
        ...(context.environmentId && { environment: { _id: context.environmentId } }),
        ...(context.organizationId && { organization: { _id: context.organizationId } }),
        ...(context.userId && { user: { _id: context.userId } }),
      } as Parameters<typeof this.featureFlagsService.getFlag<number>>[0];

      const expirationDays = await this.featureFlagsService.getFlag(flagContext);

      return addDays(new Date(), expirationDays);
    } catch (error) {
      this.logger.warn(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to fetch log expiration days from LaunchDarkly, falling back to 100 days'
      );

      return addDays(new Date(), DEFAULT_EXPIRATION_DAYS);
    }
  }

  protected buildWhereClause(where: Where<TEnhancedType>): {
    clause: string;
    params: Record<string, unknown>;
  } {
    const rawWhere = where as unknown as Where<InferClickhouseSchemaType<TSchema>>;
    let allConditions: WhereCondition<InferClickhouseSchemaType<TSchema>>[] = [];

    if ('__unsafe' in rawWhere) {
      this.logger.warn('Using unsafe WHERE clause without tenant enforcement', {
        table: this.table,
        conditionsCount: rawWhere.conditions.length,
      });
      allConditions = rawWhere.conditions;
    } else {
      const enforcedConditions = this.buildEnforcedConditions(rawWhere.enforced);
      allConditions = [...enforcedConditions, ...(rawWhere.conditions || [])];
    }

    return this.buildWhereClauseFromConditions(allConditions);
  }

  private buildEnforcedConditions(enforced: EnforcedContext): WhereCondition<InferClickhouseSchemaType<TSchema>>[] {
    const condition = {
      field: 'environment_id' as keyof InferClickhouseSchemaType<TSchema>,
      operator: '=' as const,
      value: enforced.environmentId,
    };

    const conditions: WhereCondition<InferClickhouseSchemaType<TSchema>>[] = [condition];

    return conditions;
  }

  private buildWhereClauseFromConditions(conditions: WhereCondition<InferClickhouseSchemaType<TSchema>>[]): {
    clause: string;
    params: Record<string, unknown>;
  } {
    const params: Record<string, unknown> = {};
    let paramIndex = 0;

    const buildSingleCondition = (condition: WhereCondition<InferClickhouseSchemaType<TSchema>>): string => {
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
    data: Omit<TEnhancedType, 'id' | 'expires_at'> & { id?: string },
    context: {
      organizationId?: string;
      environmentId?: string;
      userId?: string;
    },
    options: InsertOptions
  ): Promise<void> {
    const id: string = data?.id || `${this.identifierPrefix}${generateObjectId()}`;
    const expirationDate = await this.getExpirationDate(context);
    const expiresAt = LogRepository.formatDateTime64(expirationDate);

    await this.clickhouseService.insert(this.table, [{ ...data, id, expires_at: expiresAt }], options);
  }

  protected async insertMany(
    data: Omit<TEnhancedType, 'id' | 'expires_at'>[],
    context: {
      organizationId?: string;
      environmentId?: string;
      userId?: string;
    },
    options: InsertOptions
  ): Promise<void> {
    const ids = data.map((_item) => `${this.identifierPrefix}${generateObjectId()}`);
    const expirationDate = await this.getExpirationDate(context);
    const expiresAt = LogRepository.formatDateTime64(expirationDate);

    await this.clickhouseService.insert(
      this.table,
      data.map((item, index) => ({ ...item, id: ids[index], expires_at: expiresAt })),
      options
    );
  }

  async find<T extends readonly (keyof InferClickhouseSchemaType<TSchema>)[]>(options: {
    where: Where<TEnhancedType>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: T;
  }): Promise<{
    data: Prettify<Pick<TEnhancedType, T[number]>>[];
    rows: number;
  }>;

  async find(options: {
    where: Where<TEnhancedType>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: '*';
  }): Promise<{
    data: TEnhancedType[];
    rows: number;
  }>;

  async find<T extends readonly (keyof InferClickhouseSchemaType<TSchema>)[] | '*'>(options: {
    where: Where<TEnhancedType>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: T;
  }): Promise<{
    data:
      | TEnhancedType[]
      | Prettify<Pick<TEnhancedType, T extends readonly (keyof TEnhancedType)[] ? T[number] : never>>[];
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
      this.validateColumnName(String(orderBy));

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
      data: TEnhancedType[] | Pick<TEnhancedType, T extends readonly (keyof TEnhancedType)[] ? T[number] : never>[];
      rows: number;
    };
  }

  async findOne<T extends readonly (keyof InferClickhouseSchemaType<TSchema>)[]>(options: {
    where: Where<TEnhancedType>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: T;
  }): Promise<{
    data: Pick<TEnhancedType, T[number]> | undefined;
    rows: number;
  }>;

  async findOne(options: {
    where: Where<TEnhancedType>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: '*';
  }): Promise<{
    data: TEnhancedType | undefined;
    rows: number;
  }>;

  async findOne<T extends readonly (keyof InferClickhouseSchemaType<TSchema>)[] | '*'>(options: {
    where: Where<TEnhancedType>;
    limit?: number;
    offset?: number;
    orderBy?: SchemaKeys<TSchema>;
    orderDirection?: 'ASC' | 'DESC';
    useFinal?: boolean;
    select: T;
  }): Promise<{
    data:
      | TEnhancedType
      | Pick<TEnhancedType, T extends readonly (keyof TEnhancedType)[] ? T[number] : never>
      | undefined;
    rows: number;
  }> {
    if (options.select === '*') {
      const result = await this.find({
        ...options,
        limit: 1,
        select: '*',
      } as Parameters<typeof this.find>[0]);

      return { data: result.data[0], rows: result.rows };
    }

    const result = await this.find({
      ...options,
      limit: 1,
      select: options.select as T extends readonly (keyof InferClickhouseSchemaType<TSchema>)[] ? T : never,
    } as Parameters<typeof this.find>[0]);

    return { data: result.data[0], rows: result.rows };
  }

  async count(options: { where: Where<TEnhancedType>; useFinal?: boolean }): Promise<number> {
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
    return this.where(field, 'hasAny', values as T[K][]);
  }

  whereHasAll<K extends keyof T>(field: K, values: T[K]): this {
    return this.where(field, 'hasAll', values as T[K][]);
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
