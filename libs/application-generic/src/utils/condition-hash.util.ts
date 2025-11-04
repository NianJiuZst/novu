import { createHash } from 'crypto';

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

export function generateConditionHash(data?: unknown): string | undefined {
  if (!data) {
    return undefined;
  }

  // Sort object keys recursively to produce a deterministic JSON string for hashing.
  // Arrays are traversed (their elements' keys are sorted) but array order is preserved.
  const sortedData = sortKeysRecursively(data);
  const normalizedJson = JSON.stringify(sortedData);

  return createHash('sha256').update(normalizedJson).digest('hex');
}
