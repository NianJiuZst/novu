import type { SubscriberEntity, TopicEntity, TopicSubscribersEntity } from '@novu/dal';
import type { TopicResponseDto } from '../../dtos/topic-response.dto';
import type { TopicSubscriptionResponseDto } from '../../dtos/topic-subscription-response.dto';

export function mapTopicEntityToDto(topicEntity: TopicEntity): TopicResponseDto {
  return {
    _id: String(topicEntity._id),
    name: topicEntity.name,
    key: topicEntity.key,
    createdAt: topicEntity.createdAt,
    updatedAt: topicEntity.updatedAt,
  };
}

export function mapTopicSubscriptionsToDto(
  subscription: TopicSubscribersEntity,
  subscriber: SubscriberEntity,
  topic: TopicEntity
): TopicSubscriptionResponseDto {
  return {
    _id: String(subscription._id),
    topic: mapTopicEntityToDto(topic),
    createdAt: subscription.createdAt!,
    subscriber: {
      _id: String(subscriber._id),
      subscriberId: subscriber.subscriberId,
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      email: subscriber.email,
      avatar: subscriber.avatar,
    },
  };
}
