import { createHash } from 'crypto';

export function generateConditionHash(
  resourceConditions?: Record<string, unknown>,
  subscriberConditions?: Record<string, unknown>
): string | undefined {
  if (!resourceConditions && !subscriberConditions) {
    return undefined;
  }

  const conditionsToHash = {
    resource: resourceConditions || null,
    subscriber: subscriberConditions || null,
  };

  const normalizedJson = JSON.stringify(conditionsToHash, Object.keys(conditionsToHash).sort());

  return createHash('sha256').update(normalizedJson).digest('hex');
}
