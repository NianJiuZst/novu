import { z } from 'zod';
import { Prettify } from '../../../utils/prettify.type';
import { ClickHouseTypes as CH, createClickHouseSchema, InferClickHouseSchema } from '../clickhouse-native';

export const TABLE_NAME = 'requests';

const requestLogZodSchema = z.object({
  id: z.string().describe(CH.String()),
  created_at: z.date().describe(CH.DateTime64(3, 'UTC')),
  path: z.string().describe(CH.String()),
  url: z.string().describe(CH.String()),
  url_pattern: z.string().describe(CH.String()),
  hostname: z.string().describe(CH.String()),
  status_code: z.number().int().describe(CH.UInt16()),
  method: z.string().describe(CH.LowCardinality(CH.String())),
  transaction_id: z.string().describe(CH.String()),
  ip: z.string().describe(CH.String()),
  user_agent: z.string().describe(CH.String()),
  request_body: z.string().describe(CH.String()),
  response_body: z.string().describe(CH.String()),
  user_id: z.string().describe(CH.String()),
  organization_id: z.string().describe(CH.String()),
  environment_id: z.string().describe(CH.String()),
  auth_type: z.string().describe(CH.String()),
  duration_ms: z.number().int().describe(CH.UInt32()),
  expires_at: z.date().describe(CH.DateTime64(3, 'UTC')),
});

export const ORDER_BY: (keyof z.infer<typeof requestLogZodSchema>)[] = [
  'organization_id',
  'environment_id',
  'transaction_id',
  'created_at',
];

export const TTL: keyof z.infer<typeof requestLogZodSchema> = 'expires_at';

const clickhouseSchemaOptions = {
  table_name: TABLE_NAME,
  engine: 'MergeTree',
  order_by: `(${ORDER_BY.join(', ')})`,
  additional_options: ['PARTITION BY toYYYYMM(created_at)', `TTL toDateTime(${TTL})`],
};

export const requestLogSchema = createClickHouseSchema(requestLogZodSchema, clickhouseSchemaOptions);

export type RequestLogComplex = InferClickHouseSchema<typeof requestLogSchema>;

export type RequestLog = Prettify<RequestLogComplex>;
