import { z } from 'zod';
import { Prettify } from '../../../utils/prettify.type';
import { ClickHouseTypes as CH, createClickHouseSchema, InferClickHouseSchema } from '../clickhouse-native';

export const TABLE_NAME = 'step_runs';

const stepRunZodSchema = z.object({
  id: z.string().describe(CH.String()),
  created_at: z.date().describe(CH.DateTime64(3, 'UTC')),
  updated_at: z.date().describe(CH.DateTime64(3, 'UTC')),

  // Core step run identification
  step_run_id: z.string().describe(CH.String()), // Maps to JobEntity._id
  step_id: z.string().describe(CH.String()), // Maps to messageTemplate._id
  workflow_run_id: z.string().nullable().describe(CH.Nullable(CH.String())), // Maps to NotificationEntity._id

  // Context
  organization_id: z.string().describe(CH.String()),
  environment_id: z.string().describe(CH.String()),
  user_id: z.string().describe(CH.String()),
  subscriber_id: z.string().describe(CH.String()),
  external_subscriber_id: z.string().nullable().describe(CH.Nullable(CH.String())),
  message_id: z.string().nullable().describe(CH.Nullable(CH.String())), // Links to MessageEntity

  // Step metadata
  step_type: z.string().describe(CH.LowCardinality(CH.String())), // email, sms, in_app, push, etc.
  step_name: z.string().nullable().describe(CH.Nullable(CH.String())), // todo remove this parameter because we do not have step name at this stage.
  provider_id: z.string().nullable().describe(CH.Nullable(CH.String())),

  // Execution details
  status: z.string().describe(CH.LowCardinality(CH.String())), // pending, queued, running, completed, failed, skipped, cancelled

  // Error handling
  error_code: z.string().nullable().describe(CH.Nullable(CH.String())),
  error_message: z.string().nullable().describe(CH.Nullable(CH.String())),

  // Correlation
  transaction_id: z.string().describe(CH.String()),

  // Data retention
  expires_at: z.date().describe(CH.DateTime64(3, 'UTC')),
});

export const ORDER_BY: (keyof z.infer<typeof stepRunZodSchema>)[] = ['organization_id', 'step_run_id'];

export const TTL: keyof z.infer<typeof stepRunZodSchema> = 'expires_at';

const clickhouseSchemaOptions = {
  table_name: TABLE_NAME,
  engine: 'ReplacingMergeTree(updated_at)',
  order_by: `(${ORDER_BY.join(', ')})`,
  additional_options: ['PARTITION BY toYYYYMM(created_at)', `TTL toDateTime(${TTL})`],
};

export const stepRunSchema = createClickHouseSchema(stepRunZodSchema, clickhouseSchemaOptions);

export type StepType = 'email' | 'sms' | 'in_app' | 'push' | 'chat' | 'digest' | 'trigger' | 'delay' | 'custom';

export type StepRunNonFinalStatus = 'pending' | 'queued' | 'running' | 'delayed';
export type StepRunFinalStatus = 'completed' | 'failed' | 'canceled' | 'merged' | 'skipped';
export type StepRunStatus = StepRunNonFinalStatus | StepRunFinalStatus;

type NativeStepRun = InferClickHouseSchema<typeof stepRunSchema>;

type StepRunComplex = Omit<NativeStepRun, 'status' | 'step_type'> & {
  status: StepRunStatus;
  step_type: StepType;
};

export type StepRun = Prettify<StepRunComplex>;
