import { createHash } from 'crypto';

interface SubscriptionHashData {
  conditions: Record<string, unknown> | null;
  workflows: { _id: string; enabled: boolean }[] | null;
}

function sortKeysRecursively(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeysRecursively);
  }

  return Object.keys(obj)
    .sort()
    .reduce(
      (result, key) => {
        result[key] = sortKeysRecursively((obj as Record<string, unknown>)[key]);
        return result;
      },
      {} as Record<string, unknown>
    );
}

export function generateConditionHash(data?: SubscriptionHashData): string | undefined {
  if (!data || (!data.conditions && !data.workflows)) {
    return undefined;
  }

  // Sort object keys recursively to produce a deterministic JSON string for hashing.
  // Arrays are traversed (their elements' keys are sorted) but array order is preserved.
  const sortedData = sortKeysRecursively(data);
  const normalizedJson = JSON.stringify(sortedData);

  return createHash('sha256').update(normalizedJson).digest('hex');
}
