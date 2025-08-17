import { z } from 'zod';
import { Prettify } from '../../../utils/prettify.type';
import { ClickHouseTypes as CH, createClickHouseSchema, InferClickHouseSchema } from '../clickhouse-native';

export const TABLE_NAME = 'workflow_runs';

// Enum for backwards compatibility (mapped to Zod types)
export enum WorkflowRunStatusEnum {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

const workflowRunZodSchema = z.object({
  id: z.string().describe(CH.String()),
  created_at: z.date().describe(CH.DateTime64(3, 'UTC')),
  updated_at: z.date().describe(CH.DateTime64(3, 'UTC')),

  // Core workflow run identification
  workflow_run_id: z.string().describe(CH.String()), // Maps to NotificationEntity._id
  workflow_id: z.string().describe(CH.String()), // Maps to NotificationTemplateEntity._id
  workflow_name: z.string().describe(CH.String()), // Maps to NotificationTemplateEntity.name

  // Context
  organization_id: z.string().describe(CH.String()),
  environment_id: z.string().describe(CH.String()),
  user_id: z.string().nullable().describe(CH.Nullable(CH.String())),
  subscriber_id: z.string().describe(CH.String()),
  external_subscriber_id: z.string().nullable().describe(CH.Nullable(CH.String())),

  // Execution metadata
  status: z.nativeEnum(WorkflowRunStatusEnum).describe(CH.LowCardinality(CH.String())),
  trigger_identifier: z.string().describe(CH.String()), // The event identifier that triggered the workflow

  // Correlation and grouping
  transaction_id: z.string().describe(CH.String()),
  channels: z.string().describe(CH.String()), // JSON array of channels: ["email", "sms", "push"]

  // Subscriber context
  subscriber_to: z.string().nullable().describe(CH.Nullable(CH.String())), // JSON representation of the 'to' field
  payload: z.string().nullable().describe(CH.Nullable(CH.String())), // JSON representation of the payload
  control_values: z.string().nullable().describe(CH.Nullable(CH.String())), // JSON representation of controls

  // Topic information
  topics: z.string().nullable().describe(CH.Nullable(CH.String())), // JSON array of topics

  // Digest information
  is_digest: z.boolean().describe(CH.String()), // Boolean stored as 'true'/'false' strings in ClickHouse
  digested_workflow_run_id: z.string().nullable().describe(CH.Nullable(CH.String())), // Reference to parent digest if this is a digested notification

  // Data retention
  expires_at: z.date().describe(CH.DateTime64(3, 'UTC')),
});

export const ORDER_BY: (keyof z.infer<typeof workflowRunZodSchema>)[] = ['organization_id', 'workflow_run_id'];

export const TTL: keyof z.infer<typeof workflowRunZodSchema> = 'expires_at';

const clickhouseSchemaOptions = {
  table_name: TABLE_NAME,
  engine: 'ReplacingMergeTree(updated_at)',
  order_by: `(${ORDER_BY.join(', ')})`,
  additional_options: ['PARTITION BY toYYYYMM(created_at)', `TTL toDateTime(${TTL})`],
};

export const workflowRunSchema = createClickHouseSchema(workflowRunZodSchema, clickhouseSchemaOptions);

// Derive types from Zod schema
export type WorkflowRunStatus = z.infer<typeof workflowRunZodSchema>['status'];
export type WorkflowRunDigestFlag = z.infer<typeof workflowRunZodSchema>['is_digest'];

// Native WorkflowRun type derived from schema
export type WorkflowRun = Prettify<InferClickHouseSchema<typeof workflowRunSchema>>;
