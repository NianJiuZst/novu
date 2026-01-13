import { ClickHouseSchema, ch, InferSchemaType } from '../../schema';
import { Prettify } from '../../utils/prettify.type';

export const TABLE_NAME = 'requests';

export const requestSchema = new ClickHouseSchema(
  {
    id: ch.string(),
    created_at: ch.datetime64(3, 'UTC'),
    path: ch.string(),
    url: ch.string(),
    url_pattern: ch.string(),
    hostname: ch.string(),
    status_code: ch.uint16(),
    method: ch.lowCardinality(ch.string()),
    transaction_id: ch.string(),
    ip: ch.string(),
    user_agent: ch.string(),
    request_body: ch.string(),
    response_body: ch.string(),
    user_id: ch.string(),
    organization_id: ch.string(),
    environment_id: ch.string(),
    auth_type: ch.string(),
    duration_ms: ch.uint32(),
    expires_at: ch.datetime64(3, 'UTC'),
  },
  {
    tableName: TABLE_NAME,
    orderBy: ['organization_id', 'environment_id', 'transaction_id', 'created_at'],
  }
);

type RequestSchemaType = InferSchemaType<typeof requestSchema>;

export const ORDER_BY: (keyof RequestSchemaType)[] = [
  'organization_id',
  'environment_id',
  'transaction_id',
  'created_at',
];

export const TTL: keyof RequestSchemaType = 'expires_at';

export type RequestComplex = RequestSchemaType;

export type Request = Prettify<RequestComplex>;
