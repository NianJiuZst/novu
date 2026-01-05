import {
  CHAggregateFunction,
  CHDate,
  CHLowCardinality,
  CHNullable,
  CHString,
  CHUInt8,
  ClickhouseSchema,
  InferClickhouseSchemaType,
} from 'clickhouse-schema';
import { Prettify } from '../../../utils/prettify.type';
import { StepType } from '..';

export const TABLE_NAME_DAILY = 'step_runs_daily';

const dailySchemaDefinition = {
  date: { type: CHDate() },
  environment_id: { type: CHString() },
  organization_id: { type: CHString() },
  workflow_id: { type: CHString() },
  step_type: { type: CHLowCardinality(CHString()) },
  provider_id: { type: CHNullable(CHString()) },

  total_count: { type: CHAggregateFunction('count') },
  completed_count: { type: CHAggregateFunction('countIf', CHUInt8()) },
  unique_subscribers: { type: CHAggregateFunction('uniq', CHString()) },
};

export const ORDER_BY_DAILY: (keyof typeof dailySchemaDefinition)[] = [
  'organization_id',
  'environment_id',
  'date',
  'workflow_id',
  'step_type',
];

export const TTL_DAILY: keyof typeof dailySchemaDefinition = 'date';

const clickhouseSchemaOptions = {
  table_name: TABLE_NAME_DAILY,
  engine: 'AggregatingMergeTree()',
  order_by: `(${ORDER_BY_DAILY.join(', ')})` as any,
  additional_options: ['PARTITION BY toYYYYMM(date)', `TTL ${TTL_DAILY} + INTERVAL 400 DAY`],
};

export const stepRunDailySchema = new ClickhouseSchema(dailySchemaDefinition, clickhouseSchemaOptions);

type NativeStepRunDaily = InferClickhouseSchemaType<typeof stepRunDailySchema>;

type StepRunDailyComplex = Omit<NativeStepRunDaily, 'step_type'> & {
  step_type: StepType;
};

export type StepRunDaily = Prettify<StepRunDailyComplex>;

export const STEP_RUNS_DAILY_MV_NAME = 'step_runs_daily_mv';

export function getStepRunsDailyMaterializedViewSQL(): string {
  return `
CREATE MATERIALIZED VIEW IF NOT EXISTS ${STEP_RUNS_DAILY_MV_NAME} TO ${TABLE_NAME_DAILY} AS
SELECT
    toDate(created_at) AS date,
    environment_id,
    organization_id,
    workflow_id,
    step_type,
    provider_id,
    countState() AS total_count,
    countIfState(status = 'completed') AS completed_count,
    uniqState(external_subscriber_id) AS unique_subscribers
FROM step_runs
GROUP BY date, environment_id, organization_id, workflow_id, step_type, provider_id
`;
}
