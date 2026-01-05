import {
  CHAggregateFunction,
  CHDate,
  CHLowCardinality,
  CHString,
  ClickhouseSchema,
  InferClickhouseSchemaType,
} from 'clickhouse-schema';
import { Prettify } from '../../../utils/prettify.type';
import { EventType } from './trace-log.schema';

export const TABLE_NAME_DAILY = 'traces_daily';

const dailySchemaDefinition = {
  date: { type: CHDate() },
  environment_id: { type: CHString() },
  organization_id: { type: CHString() },
  workflow_id: { type: CHString() },
  event_type: { type: CHLowCardinality(CHString()) },

  total_count: { type: CHAggregateFunction('count') },
};

export const ORDER_BY_DAILY: (keyof typeof dailySchemaDefinition)[] = [
  'organization_id',
  'environment_id',
  'date',
  'event_type',
];

export const TTL_DAILY: keyof typeof dailySchemaDefinition = 'date';

const clickhouseSchemaOptions = {
  table_name: TABLE_NAME_DAILY,
  engine: 'AggregatingMergeTree()',
  order_by: `(${ORDER_BY_DAILY.join(', ')})` as any,
  additional_options: ['PARTITION BY toYYYYMM(date)', `TTL ${TTL_DAILY} + INTERVAL 400 DAY`],
};

export const traceLogDailySchema = new ClickhouseSchema(dailySchemaDefinition, clickhouseSchemaOptions);

type NativeTraceLogDaily = InferClickhouseSchemaType<typeof traceLogDailySchema>;

type TraceLogDailyComplex = Omit<NativeTraceLogDaily, 'event_type'> & {
  event_type: EventType;
};

export type TraceLogDaily = Prettify<TraceLogDailyComplex>;

export const TRACES_DAILY_MV_NAME = 'traces_daily_mv';

export function getTracesDailyMaterializedViewSQL(): string {
  return `
CREATE MATERIALIZED VIEW IF NOT EXISTS ${TRACES_DAILY_MV_NAME} TO ${TABLE_NAME_DAILY} AS
SELECT
    toDate(created_at) AS date,
    environment_id,
    organization_id,
    workflow_id,
    event_type,
    countState() AS total_count
FROM traces
WHERE entity_type = 'step_run'
GROUP BY date, environment_id, organization_id, workflow_id, event_type
`;
}
