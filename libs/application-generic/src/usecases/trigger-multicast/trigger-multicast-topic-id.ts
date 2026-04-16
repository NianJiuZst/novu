/**
 * Topic documents from Mongo may expose `_id` as an ObjectId while aggregation
 * pipelines often yield topic ids as strings. Compare using a canonical string form.
 */
export function topicIdToComparableString(id: unknown): string {
  if (id === null || id === undefined) {
    return '';
  }

  if (typeof id === 'object' && 'toString' in id && typeof (id as { toString: () => string }).toString === 'function') {
    return (id as { toString: () => string }).toString();
  }

  return String(id);
}
