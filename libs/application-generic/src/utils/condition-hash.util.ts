import { createHash } from 'crypto';

export function generateConditionHash(condition?: Record<string, unknown>): string | undefined {
  if (!condition) {
    return undefined;
  }

  const normalizedJson = JSON.stringify(condition, Object.keys(condition).sort());

  return createHash('sha256').update(normalizedJson).digest('hex');
}
