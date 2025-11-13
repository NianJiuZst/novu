import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { generateConditionHash, InstrumentUsecase } from '@novu/application-generic';
import {
  SubscriberEntity,
  SubscriberRepository,
  TopicEntity,
  TopicRepository,
  TopicSubscribersEntity,
  TopicSubscribersRepository,
} from '@novu/dal';
import {
  SubscriberDto,
  SubscriptionWorkflowDto,
  TopicDto,
  TopicSubscriptionDto,
} from '../../dtos/get-topic-subscriptions-response.dto';
import { UpdateTopicSubscriptionCommand } from './update-topic-subscription.command';

@Injectable()
export class UpdateTopicSubscription {
  constructor(
    private topicRepository: TopicRepository,
    private topicSubscribersRepository: TopicSubscribersRepository,
    private subscriberRepository: SubscriberRepository
  ) {}

  @InstrumentUsecase()
  async execute(command: UpdateTopicSubscriptionCommand): Promise<TopicSubscriptionDto> {
    const subscriber = await this.subscriberRepository.findBySubscriberId(command.environmentId, command.subscriberId);

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    const existingSubscription = await this.topicSubscribersRepository.findOne({
      _id: command.subscriptionId,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    if (!existingSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (existingSubscription.externalSubscriberId !== command.subscriberId) {
      throw new ForbiddenException('You do not have permission to update this subscription');
    }

    const topic = await this.topicRepository.findTopicByKey(
      command.topicKey,
      command.organizationId,
      command.environmentId
    );

    if (!topic) {
      throw new NotFoundException(`Topic with key ${command.topicKey} not found`);
    }

    const workflows = command.workflows.map((workflow) => ({
      _id: workflow.id,
      enabled: workflow.enabled,
    }));

    const conditionHash = command.conditions
      ? generateConditionHash({ conditions: command.conditions, workflows })
      : undefined;

    const updatedSubscription = await this.topicSubscribersRepository.findOneAndUpdate(
      {
        _id: command.subscriptionId,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      {
        $set: {
          workflows,
          conditions: command.conditions,
          conditionHash,
        },
      },
      { new: true }
    );

    if (!updatedSubscription) {
      throw new Error('Failed to update subscription');
    }

    return this.mapToDto(updatedSubscription, topic, subscriber);
  }

  private mapToDto(
    subscription: TopicSubscribersEntity,
    topic: TopicEntity,
    subscriber: SubscriberEntity
  ): TopicSubscriptionDto {
    const workflowDtos: SubscriptionWorkflowDto[] =
      subscription.workflows?.map((workflow) => ({
        id: workflow._id,
        name: '',
        enabled: workflow.enabled,
      })) || [];

    return {
      _id: subscription._id,
      topic: this.mapTopicToDto(topic),
      subscriber: this.mapSubscriberToDto(subscriber),
      conditions: subscription.conditions,
      workflows: workflowDtos,
      createdAt: subscription.createdAt || '',
      updatedAt: subscription.updatedAt || '',
    };
  }

  private mapTopicToDto(topic: TopicEntity): TopicDto {
    return {
      _id: topic._id,
      key: topic.key,
      name: topic.name,
    };
  }

  private mapSubscriberToDto(subscriber: SubscriberEntity): SubscriberDto {
    return {
      _id: subscriber._id,
      subscriberId: subscriber.subscriberId,
      avatar: subscriber.avatar,
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      email: subscriber.email,
    };
  }
}
