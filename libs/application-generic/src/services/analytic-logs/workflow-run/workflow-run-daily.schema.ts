import {
  CHAggregateFunction,
  CHDate,
  CHDateTime64,
  CHString,
  ClickhouseSchema,
  InferClickhouseSchemaType,
} from 'clickhouse-schema';
import { Prettify } from '../../../utils/prettify.type';

export const TABLE_NAME_DAILY = 'workflow_runs_daily';

const dailySchemaDefinition = {
  date: { type: CHDate() },
  environment_id: { type: CHString() },
  organization_id: { type: CHString() },
  workflow_id: { type: CHString() },
  workflow_name: { type: CHString() },
  workflow_run_id: { type: CHString() },

  latest_status: { type: CHAggregateFunction('argMax', CHString(), CHDateTime64(3, 'UTC')) },
  unique_subscribers: { type: CHAggregateFunction('uniq', CHString()) },
};

export const ORDER_BY_DAILY: (keyof typeof dailySchemaDefinition)[] = [
  'organization_id',
  'environment_id',
  'date',
  'workflow_id',
  'workflow_run_id',
];

export const TTL_DAILY: keyof typeof dailySchemaDefinition = 'date';

const clickhouseSchemaOptions = {
  table_name: TABLE_NAME_DAILY,
  engine: 'AggregatingMergeTree()',
  order_by: `(${ORDER_BY_DAILY.join(', ')})` as any,
  additional_options: ['PARTITION BY toYYYYMM(date)', `TTL ${TTL_DAILY} + INTERVAL 400 DAY`],
};

export const workflowRunDailySchema = new ClickhouseSchema(dailySchemaDefinition, clickhouseSchemaOptions);

type NativeWorkflowRunDaily = InferClickhouseSchemaType<typeof workflowRunDailySchema>;

export type WorkflowRunDaily = Prettify<NativeWorkflowRunDaily>;

export const WORKFLOW_RUNS_DAILY_MV_NAME = 'workflow_runs_daily_mv';

export function getWorkflowRunsDailyMaterializedViewSQL(): string {
  return `
CREATE MATERIALIZED VIEW IF NOT EXISTS ${WORKFLOW_RUNS_DAILY_MV_NAME} TO ${TABLE_NAME_DAILY} AS
SELECT
    toDate(created_at) AS date,
    environment_id,
    organization_id,
    workflow_id,
    workflow_name,
    workflow_run_id,
    argMaxState(status, created_at) AS latest_status,
    uniqState(external_subscriber_id) AS unique_subscribers
FROM workflow_runs
GROUP BY date, environment_id, organization_id, workflow_id, workflow_name, workflow_run_id
`;
}
