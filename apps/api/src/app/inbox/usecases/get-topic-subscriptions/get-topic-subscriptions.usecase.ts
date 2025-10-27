import { Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import {
  NotificationTemplateEntity,
  NotificationTemplateRepository,
  SubscriberEntity,
  SubscriberRepository,
  TopicEntity,
  TopicRepository,
  TopicSubscribersEntity,
  TopicSubscribersRepository,
} from '@novu/dal';
import { DirectionEnum } from '@novu/shared';
import { UpsertTopicUseCase } from '../../../topics-v2/usecases/upsert-topic/upsert-topic.usecase';
import {
  SubscriberDto,
  SubscriptionWorkflowDto,
  TopicDto,
  TopicSubscriptionDto,
} from '../../dtos/get-topic-subscriptions-response.dto';
import { GetTopicSubscriptionsCommand } from './get-topic-subscriptions.command';

@Injectable()
export class GetTopicSubscriptions {
  constructor(
    private topicRepository: TopicRepository,
    private topicSubscribersRepository: TopicSubscribersRepository,
    private notificationTemplateRepository: NotificationTemplateRepository,
    private subscriberRepository: SubscriberRepository,
    private upsertTopicUseCase: UpsertTopicUseCase
  ) {}

  @InstrumentUsecase()
  async execute(command: GetTopicSubscriptionsCommand): Promise<TopicSubscriptionDto[]> {
    await this.upsertTopicUseCase.execute({
      environmentId: command.environmentId,
      organizationId: command.organizationId,
      key: command.topicKey,
    });

    const topic = await this.topicRepository.findTopicByKey(
      command.topicKey,
      command.organizationId,
      command.environmentId
    );

    if (!topic) {
      throw new Error(`Topic with key ${command.topicKey} not found after upsert`);
    }

    const subscriber = await this.subscriberRepository.findBySubscriberId(command.environmentId, command.subscriberId);

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    const subscriptions = await this.topicSubscribersRepository.find({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      topicKey: command.topicKey,
      externalSubscriberId: command.subscriberId,
    });

    const workflows = await this.queryWorkflows(command);

    if (subscriptions.length === 0 && command.includeEmptyState) {
      return this.buildEmptyStateResponse(topic, subscriber, workflows);
    }

    return this.buildSubscriptionsResponse(subscriptions, topic, subscriber, workflows);
  }

  private async queryWorkflows(command: GetTopicSubscriptionsCommand) {
    const workflowIdsToQuery = command.workflowIds || [];
    const tagsToQuery = command.tags || [];

    if (workflowIdsToQuery.length === 0 && tagsToQuery.length === 0) {
      return [];
    }

    // todo implement projection
    const result = await this.notificationTemplateRepository.getList(
      command.organizationId,
      command.environmentId,
      0,
      100,
      undefined,
      false,
      'createdAt',
      DirectionEnum.DESC,
      tagsToQuery.length > 0 ? tagsToQuery : undefined,
      undefined
    );

    return result.data || [];
  }

  private buildEmptyStateResponse(
    topic: TopicEntity,
    subscriber: SubscriberEntity,
    workflows: NotificationTemplateEntity[]
  ): TopicSubscriptionDto[] {
    const workflowDtos: SubscriptionWorkflowDto[] = workflows.map((workflow) => ({
      id: workflow.triggers[0]?.identifier || workflow._id,
      name: workflow.name || '',
      enabled: true,
    }));

    return [
      {
        _id: '',
        topic: this.mapTopicToDto(topic),
        subscriber: this.mapSubscriberToDto(subscriber),
        workflows: workflowDtos,
        createdAt: '',
        updatedAt: '',
      },
    ];
  }

  private buildSubscriptionsResponse(
    subscriptions: TopicSubscribersEntity[],
    topic: TopicEntity,
    subscriber: SubscriberEntity,
    workflows: NotificationTemplateEntity[]
  ): TopicSubscriptionDto[] {
    return subscriptions.map((subscription) => {
      const workflowDtos: SubscriptionWorkflowDto[] = workflows.map((workflowEntity) => {
        const isEnabled = subscription.workflows
          ? subscription.workflows.some(
              (subscriptionWorkflow) => subscriptionWorkflow._id === workflowEntity._id && subscriptionWorkflow.enabled
            )
          : true;

        return {
          id: workflowEntity._id,
          name: workflowEntity.name || '',
          enabled: isEnabled,
        };
      });

      return {
        _id: subscription._id,
        topic: this.mapTopicToDto(topic),
        subscriber: this.mapSubscriberToDto(subscriber),
        conditions: subscription.conditions,
        workflows: workflowDtos,
        createdAt: subscription.createdAt || '',
        updatedAt: subscription.updatedAt || '',
      };
    });
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
