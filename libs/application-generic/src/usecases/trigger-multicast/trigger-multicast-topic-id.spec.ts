import { describe, expect, it } from 'vitest';
import { topicIdToComparableString } from './trigger-multicast-topic-id';

describe('topicIdToComparableString', () => {
  it('matches ObjectId-like instance to same id string', () => {
    const hex = '507f1f77bcf86cd799439011';
    const objectIdLike = { toString: () => hex };

    expect(topicIdToComparableString(objectIdLike)).toBe(hex);
    expect(topicIdToComparableString(hex)).toBe(hex);
    expect(topicIdToComparableString(objectIdLike)).toBe(topicIdToComparableString(hex));
  });

  it('returns empty string for nullish ids', () => {
    expect(topicIdToComparableString(null)).toBe('');
    expect(topicIdToComparableString(undefined)).toBe('');
  });
});
