/**
 * Serialize values for logs / execution details without throwing on circular references
 * (e.g. Axios errors with TLSSocket / request chains).
 */
export function safeJsonStringifyForLog(value: unknown): string {
  if (value === undefined) {
    return '';
  }

  try {
    const seen = new WeakSet<object>();

    return JSON.stringify(value, (_key, val) => {
      if (val !== null && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular]';
        }

        seen.add(val);
      }

      return val;
    });
  } catch {
    if (value !== null && typeof value === 'object' && 'message' in value) {
      const err = value as Error & { code?: string; name?: string };

      return [err.name, err.message, err.code].filter(Boolean).join(': ') || '[Unserializable value]';
    }

    return String(value);
  }
}
