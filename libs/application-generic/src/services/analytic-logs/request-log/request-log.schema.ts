import { z } from 'zod';
import { Prettify } from '../../../utils/prettify.type';
import { chDateTime64, chLowCardinality, chString, chUInt16, chUInt32, InferZodChSchema } from '../v2/clickhouse-types';

export const TABLE_NAME = 'requests';

export const requestLogSchema = {
  id: { zod: z.string(), ch: chString() },
  created_at: { zod: z.string(), ch: chDateTime64(3, 'UTC') },
  path: { zod: z.string(), ch: chString() },
  url: { zod: z.string(), ch: chString() },
  url_pattern: { zod: z.string(), ch: chString() },
  hostname: { zod: z.string(), ch: chString() },
  status_code: { zod: z.number(), ch: chUInt16() },
  method: { zod: z.string(), ch: chLowCardinality(chString()) },
  transaction_id: { zod: z.string(), ch: chString() },
  ip: { zod: z.string(), ch: chString() },
  user_agent: { zod: z.string(), ch: chString() },
  request_body: { zod: z.string(), ch: chString() },
  response_body: { zod: z.string(), ch: chString() },
  user_id: { zod: z.string(), ch: chString() },
  organization_id: { zod: z.string(), ch: chString() },
  environment_id: { zod: z.string(), ch: chString() },
  auth_type: { zod: z.string(), ch: chString() },
  duration_ms: { zod: z.number(), ch: chUInt32() },
  expires_at: { zod: z.string(), ch: chDateTime64(3, 'UTC') },
} as const;

export const ORDER_BY: (keyof typeof requestLogSchema)[] = [
  'organization_id',
  'environment_id',
  'transaction_id',
  'created_at',
];

export const TTL: keyof typeof requestLogSchema = 'expires_at';

type RequestLogComplex = InferZodChSchema<typeof requestLogSchema>;

export type RequestLog = Prettify<RequestLogComplex>;
