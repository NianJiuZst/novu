/**
 * @chat-adapter/state-redis expects `REDIS_URL` or an explicit `url` option.
 * The Novu API normally uses REDIS_HOST / REDIS_PORT (see redis-provider in application-generic).
 * This builds a connection URL so the Chat SDK uses the same Redis instance as the rest of the API.
 */
export function resolveRedisUrlForChatState(): string {
  const direct = process.env.REDIS_URL?.trim();

  if (direct) {
    return direct;
  }

  const host = process.env.REDIS_HOST?.trim() || '127.0.0.1';
  const port = process.env.REDIS_PORT?.trim() || '6379';
  const password = process.env.REDIS_PASSWORD?.trim();
  const dbIndex = process.env.REDIS_DB_INDEX?.trim();
  const useTls = Boolean(process.env.REDIS_TLS);
  const protocol = useTls ? 'rediss' : 'redis';
  const auth = password ? `:${encodeURIComponent(password)}@` : '';
  const path = dbIndex ? `/${dbIndex}` : '';

  return `${protocol}://${auth}${host}:${port}${path}`;
}
