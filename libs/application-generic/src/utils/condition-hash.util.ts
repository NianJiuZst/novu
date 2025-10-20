import { createHash } from 'crypto';

// Recursively sorts object keys to ensure deterministic hashing
// Example: {user: {role: "admin", id: "123"}} becomes {user: {id: "123", role: "admin"}}
function sortKeysRecursively(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
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

export function generateConditionHash(condition?: Record<string, unknown>): string | undefined {
  if (!condition) {
    return undefined;
  }

  const sortedCondition = sortKeysRecursively(condition);
  const normalizedJson = JSON.stringify(sortedCondition);

  return createHash('sha256').update(normalizedJson).digest('hex');
}
