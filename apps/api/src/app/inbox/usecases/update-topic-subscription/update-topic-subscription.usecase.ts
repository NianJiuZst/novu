import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createDeterministicHash, InstrumentUsecase } from '@novu/application-generic';
import {
  PreferencesRepository,
  SubscriberEntity,
  SubscriberRepository,
  TopicEntity,
  TopicRepository,
  TopicSubscribersEntity,
  TopicSubscribersRepository,
} from '@novu/dal';
import { PreferencesTypeEnum } from '@novu/shared';
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
    private subscriberRepository: SubscriberRepository,
    private preferencesRepository: PreferencesRepository
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

    const workflowIds = command.workflows.map((workflow) => workflow.id);

    await this.preferencesRepository.delete({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicSubscriptionId: existingSubscription._id,
      _subscriberId: existingSubscription._subscriberId,
      type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
    });

    for (const workflow of command.workflows) {
      await this.preferencesRepository.create({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        _topicSubscriptionId: existingSubscription._id,
        _subscriberId: existingSubscription._subscriberId,
        _templateId: workflow.id,
        type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
        preferences: {
          all: {
            enabled: workflow.enabled,
          },
        },
      });
    }

    const preferencesHash = createDeterministicHash({
      workflows: command.workflows,
      conditions: command.conditions,
    });

    const updatedSubscription = await this.topicSubscribersRepository.findOneAndUpdate(
      {
        _id: command.subscriptionId,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      {
        $set: {
          preferencesHash,
        },
      },
      { new: true }
    );

    if (!updatedSubscription) {
      throw new Error('Failed to update subscription');
    }

    return await this.mapToDto(updatedSubscription, topic, subscriber, workflowIds);
  }

  private async mapToDto(
    subscription: TopicSubscribersEntity,
    topic: TopicEntity,
    subscriber: SubscriberEntity,
    workflowIds: string[]
  ): Promise<TopicSubscriptionDto> {
    const preferencesEntities = await this.preferencesRepository.find({
      _environmentId: subscription._environmentId,
      _organizationId: subscription._organizationId,
      _topicSubscriptionId: subscription._id,
      _subscriberId: subscription._subscriberId,
      _templateId: { $in: workflowIds },
      type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
    });

    const workflowDtos: SubscriptionWorkflowDto[] = preferencesEntities.map((pref) => ({
      id: pref._templateId?.toString() || '',
      name: '',
      enabled: pref.preferences?.all?.enabled ?? true,
    }));

    return {
      _id: subscription._id,
      topic: this.mapTopicToDto(topic),
      subscriber: this.mapSubscriberToDto(subscriber),
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
