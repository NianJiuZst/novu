import { StepTypeEnum } from '@novu/shared';
import { z } from 'zod';
import { Prettify } from '../../../utils/prettify.type';
import {
  ClickHouseTypes as CH,
  createClickHouseSchema,
  createEnumMapper,
  InferClickHouseSchema,
} from '../clickhouse-native';

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
  step_type: z
    .enum(['email', 'sms', 'in_app', 'push', 'chat', 'digest', 'trigger', 'delay', 'custom'])
    .describe(CH.LowCardinality(CH.String())),
  step_name: z.string().nullable().describe(CH.Nullable(CH.String())), // todo remove this parameter because we do not have step name at this stage.
  provider_id: z.string().nullable().describe(CH.Nullable(CH.String())),

  // Execution details
  status: z
    .enum(['pending', 'queued', 'running', 'delayed', 'completed', 'failed', 'canceled', 'merged', 'skipped'])
    .describe(CH.LowCardinality(CH.String())),

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

// Derive types from Zod schema instead of manual definitions
export type StepType = z.infer<typeof stepRunZodSchema>['step_type'];
export type StepRunStatus = z.infer<typeof stepRunZodSchema>['status'];

// Split status types for convenience
export type StepRunNonFinalStatus = 'pending' | 'queued' | 'running' | 'delayed';
export type StepRunFinalStatus = 'completed' | 'failed' | 'canceled' | 'merged' | 'skipped';

// Native StepRun type derived from schema
export type StepRun = Prettify<InferClickHouseSchema<typeof stepRunSchema>>;

// Enum mapper for converting StepTypeEnum to StepType
export const stepTypeEnumMapper = createEnumMapper<StepTypeEnum, StepType>(
  {
    [StepTypeEnum.EMAIL]: 'email',
    [StepTypeEnum.SMS]: 'sms',
    [StepTypeEnum.IN_APP]: 'in_app',
    [StepTypeEnum.PUSH]: 'push',
    [StepTypeEnum.CHAT]: 'chat',
    [StepTypeEnum.DIGEST]: 'digest',
    [StepTypeEnum.TRIGGER]: 'trigger',
    [StepTypeEnum.DELAY]: 'delay',
    [StepTypeEnum.CUSTOM]: 'custom',
  },
  'custom'
);
