import { z } from 'zod';
import { Prettify } from '../../../utils/prettify.type';
import { ClickHouseTypes as CH, createClickHouseSchema, InferClickHouseSchema } from '../clickhouse-native';

export const TABLE_NAME = 'traces';

// Define the enum values as a const array for reuse
const EVENT_TYPE_VALUES = [
  'message_seen',
  'message_unseen',
  'message_read',
  'message_unread',
  'message_archived',
  'message_unarchived',
  'message_snoozed',
  'message_unsnoozed',
  'message_created',
  'message_sent',
  'message_unsnooze_failed',
  'message_content_failed',
  'message_sending_started',
  'message_severity_overridden',
  'step_created',
  'step_queued',
  'step_delayed',
  'step_digested',
  'step_filtered',
  'step_filter_processing',
  'step_filter_failed',
  'subscriber_integration_missing',
  'subscriber_channel_missing',
  'subscriber_validation_failed',
  'topic_not_found',
  'provider_error',
  'provider_limit_exceeded',
  'digest_merged',
  'digest_skipped',
  'digest_triggered',
  'digest_started',
  'delay_completed',
  'delay_misconfigured',
  'delay_limit_exceeded',
  'bridge_response_received',
  'bridge_execution_failed',
  'bridge_execution_skipped',
  'webhook_filter_retrying',
  'webhook_filter_failed',
  'integration_selected',
  'layout_not_found',
  'layout_selected',
  'tenant_selected',
  'tenant_not_found',
  'chat_webhook_missing',
  'chat_all_channels_failed',
  'chat_phone_missing',
  'push_tokens_missing',
  'chat_some_channels_skipped',
  'push_some_channels_skipped',
  'subscriber_missing_email_address',
  'subscriber_missing_phone_number',
  'reply_callback_missing',
  'reply_callback_misconfigured',
  'reply_mx_record_missing',
  'reply_mx_domain_missing',
  'variant_selected',
  'notification_error',
  'execution_detail',
  'step_completed',
  'request_received',
  'request_queued',
  'request_failed',
  'request_organization_not_found',
  'request_environment_not_found',
  'request_workflow_not_found',
  'request_invalid_recipients',
  'request_payload_validation_failed',
  'request_subscriber_processing_completed',
  'workflow_execution_started',
  'workflow_environment_not_found',
  'workflow_template_not_found',
  'workflow_template_found',
  'workflow_tenant_processing_started',
  'workflow_tenant_processing_failed',
  'workflow_tenant_processing_completed',
  'workflow_actor_processing_started',
  'workflow_actor_processing_failed',
  'workflow_actor_processing_completed',
  'workflow_execution_failed',
] as const;

const traceLogZodSchema = z.object({
  id: z.string().describe(CH.String()),
  created_at: z.date().describe(CH.DateTime64(3, 'UTC')),

  // Context
  organization_id: z.string().describe(CH.String()),
  environment_id: z.string().describe(CH.String()),
  user_id: z.string().nullable().describe(CH.Nullable(CH.String())),
  external_subscriber_id: z.string().nullable().describe(CH.Nullable(CH.String())),
  subscriber_id: z.string().nullable().describe(CH.Nullable(CH.String())),

  // Trace metadata
  event_type: z.string().describe(CH.LowCardinality(CH.String())),
  title: z.string().describe(CH.String()), // Human readable message
  message: z.string().nullable().describe(CH.Nullable(CH.String())),
  raw_data: z.string().nullable().describe(CH.Nullable(CH.String())),

  status: z.enum(['success', 'error', 'warning', 'pending']).describe(CH.LowCardinality(CH.String())),

  // Correlation, Hierarchy context
  entity_type: z.string().describe(CH.LowCardinality(CH.String())),
  entity_id: z.string().describe(CH.String()), // ID of the related entity

  // Data retention
  expires_at: z.date().describe(CH.DateTime64(3, 'UTC')),

  // Step run metadata
  step_run_type: z
    .string()
    .default('')
    .optional()
    .describe(CH.LowCardinality(CH.String(''))),

  // Workflow run metadata
  workflow_run_identifier: z.string().default('').describe(CH.String('')), // default value is empty string
});

export const ORDER_BY: (keyof z.infer<typeof traceLogZodSchema>)[] = [
  'entity_type',
  'organization_id',
  'entity_id',
  'created_at',
];

export const TTL: keyof z.infer<typeof traceLogZodSchema> = 'expires_at';

const clickhouseSchemaOptions = {
  table_name: TABLE_NAME,
  engine: 'MergeTree',
  order_by: `(${ORDER_BY.join(', ')})`,
  additional_options: ['PARTITION BY toYYYYMM(created_at)', `TTL toDateTime(${TTL})`],
};

export const traceLogSchema = createClickHouseSchema(traceLogZodSchema, clickhouseSchemaOptions);

// Derive types from Zod schema instead of manual definitions
export type EventType = z.infer<typeof traceLogZodSchema>['event_type'];
export type EntityType = z.infer<typeof traceLogZodSchema>['entity_type'];
export type TraceStatus = z.infer<typeof traceLogZodSchema>['status'];
export type StepType = z.infer<typeof traceLogZodSchema>['step_run_type'];

// Clean trace type derived from schema - no workarounds needed
export type Trace = Prettify<InferClickHouseSchema<typeof traceLogSchema>>;
