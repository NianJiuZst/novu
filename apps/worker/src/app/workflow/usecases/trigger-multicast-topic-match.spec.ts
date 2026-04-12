import { findTopicBySubscriptionTopicId } from '@novu/application-generic';
import { TopicEntity } from '@novu/dal';
import { expect } from 'chai';

describe('findTopicBySubscriptionTopicId', () => {
  it('matches topic _id to subscription _topicId when both normalize to the same string', () => {
    const id = '507f1f77bcf86cd799439011';
    const topics = [{ _id: id as TopicEntity['_id'], key: 'k1' }];

    const found = findTopicBySubscriptionTopicId(topics, id);

    expect(found).to.not.be.undefined;
    expect(found?.key).to.eq('k1');
  });

  it('returns undefined when no topic matches', () => {
    const topics = [{ _id: '507f1f77bcf86cd799439011' as TopicEntity['_id'], key: 'k1' }];

    const found = findTopicBySubscriptionTopicId(topics, '507f1f77bcf86cd799439012');

    expect(found).to.be.undefined;
  });
});
