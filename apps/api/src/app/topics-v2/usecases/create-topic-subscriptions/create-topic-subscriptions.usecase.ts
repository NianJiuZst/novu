import { Injectable } from '@nestjs/common';
import { generateConditionHash, InstrumentUsecase } from '@novu/application-generic';
import {
  BulkAddTopicSubscribersResult,
  CheckboxRule,
  ConditionType,
  CreateTopicSubscribersEntity,
  CustomRule,
  Filter,
  NotificationTemplateRepository,
  SubscriberEntity,
  SubscriberRepository,
  TopicEntity,
  TopicRepository,
  TopicSubscriberRule,
  TopicSubscribersEntity,
  TopicSubscribersRepository,
} from '@novu/dal';
import { AdditionalOperation, RulesLogic } from 'json-logic-js';
import { TopicSubscriberRuleDto } from '../../dtos/create-topic-subscriptions.dto';
import {
  CreateTopicSubscriptionsResponseDto,
  SubscriptionDto,
  SubscriptionErrorDto,
} from '../../dtos/create-topic-subscriptions-response.dto';
import { UpsertTopicUseCase } from '../upsert-topic/upsert-topic.usecase';
import { CreateTopicSubscriptionsCommand } from './create-topic-subscriptions.command';

@Injectable()
export class CreateTopicSubscriptionsUsecase {
  constructor(
    private topicRepository: TopicRepository,
    private topicSubscribersRepository: TopicSubscribersRepository,
    private subscriberRepository: SubscriberRepository,
    private notificationTemplateRepository: NotificationTemplateRepository,
    private upsertTopicUseCase: UpsertTopicUseCase
  ) {}

  @InstrumentUsecase()
  async execute(command: CreateTopicSubscriptionsCommand): Promise<CreateTopicSubscriptionsResponseDto> {
    const topic = await this.upsertAndFindOne(command);

    const errors: SubscriptionErrorDto[] = [];
    const subscriptionData: SubscriptionDto[] = [];

    const foundSubscribers = await this.subscriberRepository.searchByExternalSubscriberIds({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      externalSubscriberIds: command.subscriberIds,
    });

    const foundSubscriberIds = foundSubscribers.map((sub) => sub.subscriberId);
    const notFoundSubscriberIds = command.subscriberIds.filter((id) => !foundSubscriberIds.includes(id));

    for (const subscriberId of notFoundSubscriberIds) {
      errors.push({
        subscriberId,
        code: 'SUBSCRIBER_NOT_FOUND',
        message: `Subscriber with ID '${subscriberId}' could not be found.`,
      });
    }

    if (foundSubscribers.length === 0) {
      return {
        data: [],
        meta: {
          totalCount: command.subscriberIds.length,
          successful: 0,
          failed: command.subscriberIds.length,
        },
        errors,
      };
    }

    let subscriptionsWorkflows: { _id: string; enabled: boolean }[] | undefined;

    if (command.workflows?.ids && command.workflows.ids.length > 0) {
      const foundWorkflows = await this.notificationTemplateRepository.findByIdsOrIdentifiers(
        command.environmentId,
        command.workflows.ids
      );

      const foundWorkflowIds = new Set(foundWorkflows.map((workflow) => workflow._id));
      const notFoundWorkflows = command.workflows.ids.filter((id) => !foundWorkflowIds.has(id));

      for (const workflowId of notFoundWorkflows) {
        errors.push({
          workflowId,
          code: 'WORKFLOW_NOT_FOUND',
          message: `Workflow with ID or identifier '${workflowId}' could not be found.`,
        });
      }

      subscriptionsWorkflows = foundWorkflows.map((workflow) => ({ _id: workflow._id, enabled: true }));
    }

    const ruleEntity = this.mapRulesFromDtoToEntity(command.rules);

    const rulesHash = generateConditionHash(ruleEntity);

    const existingSubscriptionsQuery: {
      _environmentId: string;
      _organizationId: string;
      _topicId: string;
      _subscriberId: { $in: string[] };
      rulesHash?: string | { $exists: boolean };
      $or?: Array<{ rulesHash: { $exists: boolean } } | { rulesHash: null }>;
    } = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicId: topic._id,
      _subscriberId: { $in: foundSubscribers.map((sub) => sub._id) },
    };

    if (rulesHash) {
      existingSubscriptionsQuery.rulesHash = rulesHash;
    } else {
      existingSubscriptionsQuery.rulesHash = { $exists: false };
    }

    const existingSubscriptions = await this.topicSubscribersRepository.find(existingSubscriptionsQuery as any);

    const existingSubscriberIds = existingSubscriptions.map((sub) => sub._subscriberId);
    const subscribersToCreate = foundSubscribers.filter((sub) => !existingSubscriberIds.includes(sub._id));

    const { validSubscribers, limitErrors } = await this.validateSubscriptionLimit(
      topic,
      subscribersToCreate,
      command.environmentId,
      command.organizationId
    );

    errors.push(...limitErrors);

    let newSubscriptions: TopicSubscribersEntity[] = [];
    if (validSubscribers.length > 0) {
      const subscriptionsToCreate = this.buildSubscriptionEntity(
        topic,
        validSubscribers,
        ruleEntity,
        rulesHash,
        subscriptionsWorkflows
      );
      const bulkResult: BulkAddTopicSubscribersResult =
        await this.topicSubscribersRepository.createSubscriptions(subscriptionsToCreate);

      const updatedSubscriptionsWithId: TopicSubscribersEntity[] = [];
      if (bulkResult.updated.length > 0) {
        const updatedSubscriberIds = bulkResult.updated.map((sub) => sub._subscriberId);
        const fetchedUpdated = await this.topicSubscribersRepository.find({
          _environmentId: command.environmentId,
          _organizationId: command.organizationId,
          _topicId: topic._id,
          _subscriberId: { $in: updatedSubscriberIds },
          ...(rulesHash ? { rulesHash } : { rulesHash: { $exists: false } }),
        });
        updatedSubscriptionsWithId.push(...fetchedUpdated);
      }

      newSubscriptions = [...bulkResult.created, ...updatedSubscriptionsWithId];

      for (const failure of bulkResult.failed) {
        errors.push({
          subscriberId: failure.subscriberId,
          code: 'SUBSCRIPTION_CREATION_FAILED',
          message: failure.message,
        });
      }
    }

    const allSubscriptions = [...existingSubscriptions, ...newSubscriptions];
    // Map subscriptions to response format
    for (const subscription of allSubscriptions) {
      const subscriber = foundSubscribers.find((sub) => sub._id === subscription._subscriberId);

      subscriptionData.push({
        _id: subscription._id,
        topic: {
          _id: topic._id,
          key: topic.key,
          name: topic.name,
        },
        subscriber: subscriber
          ? {
              _id: subscriber._id,
              subscriberId: subscriber.subscriberId,
              avatar: subscriber.avatar,
              firstName: subscriber.firstName,
              lastName: subscriber.lastName,
              email: subscriber.email,
            }
          : null,
        rules: subscription.rules,
        createdAt: subscription.createdAt ?? '',
        updatedAt: subscription.updatedAt ?? '',
      });
    }

    return {
      data: subscriptionData,
      meta: {
        totalCount: command.subscriberIds.length,
        successful: subscriptionData.length,
        failed: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async upsertAndFindOne(command: CreateTopicSubscriptionsCommand) {
    await this.upsertTopicUseCase.execute({
      environmentId: command.environmentId,
      organizationId: command.organizationId,
      userId: command.userId,
      key: command.topicKey,
    });

    // Get the topic entity from the repository after upsert
    const topic = await this.topicRepository.findTopicByKey(
      command.topicKey,
      command.organizationId,
      command.environmentId
    );

    if (!topic) {
      throw new Error(`Topic with key ${command.topicKey} not found after upsert`);
    }

    return topic;
  }

  private mapRulesFromDtoToEntity(rules?: TopicSubscriberRuleDto[]): TopicSubscriberRule[] | undefined {
    if (!rules) {
      return undefined;
    }

    return rules.map((rule) => {
      const filter: Filter = {
        workflows: rule.filter.workflows ?? [],
        tags: rule.filter.tags ?? [],
      };

      const condition = rule.condition === undefined ? true : rule.condition;

      if (typeof condition === 'boolean') {
        return {
          filter,
          condition,
          type: ConditionType.CHECKBOX,
        } satisfies CheckboxRule;
      }

      return {
        filter,
        condition: condition as RulesLogic<AdditionalOperation>,
        type: ConditionType.CUSTOM,
      } satisfies CustomRule;
    });
  }

  private async validateSubscriptionLimit(
    topic: TopicEntity,
    subscribers: SubscriberEntity[],
    environmentId: string,
    organizationId: string
  ): Promise<{
    validSubscribers: SubscriberEntity[];
    limitErrors: SubscriptionErrorDto[];
  }> {
    const MAX_SUBSCRIPTIONS_PER_SUBSCRIBER = 10;
    const BATCH_SIZE = 100;

    if (subscribers.length === 0) {
      return { validSubscribers: [], limitErrors: [] };
    }

    const subscriberCountMap = new Map<string, number>();

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const subscriberIds = batch.map((sub) => sub._id.toString());

      const batchCountMap = await this.topicSubscribersRepository.countSubscriptionsPerSubscriber({
        environmentId,
        organizationId,
        topicId: topic._id,
        subscriberIds,
      });

      for (const [subscriberId, count] of batchCountMap.entries()) {
        subscriberCountMap.set(subscriberId, count);
      }
    }

    const validSubscribers: SubscriberEntity[] = [];
    const limitErrors: SubscriptionErrorDto[] = [];

    for (const subscriber of subscribers) {
      const count = subscriberCountMap.get(subscriber._id) || 0;

      if (count >= MAX_SUBSCRIPTIONS_PER_SUBSCRIBER) {
        limitErrors.push({
          subscriberId: subscriber.subscriberId,
          code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
          message: `Subscriber ${subscriber.subscriberId} has reached the maximum allowed of ${MAX_SUBSCRIPTIONS_PER_SUBSCRIBER} subscriptions for topic "${topic.key}"`,
        });
      } else {
        validSubscribers.push(subscriber);
      }
    }

    return { validSubscribers, limitErrors };
  }

  private buildSubscriptionEntity(
    topic: TopicEntity,
    subscribers: SubscriberEntity[],
    rules?: TopicSubscriberRule[],
    rulesHash?: string,
    subscriptionsWorkflows?: { _id: string; enabled: boolean }[]
  ): CreateTopicSubscribersEntity[] {
    return subscribers.map((subscriber) => ({
      _environmentId: subscriber._environmentId,
      _organizationId: subscriber._organizationId,
      _subscriberId: subscriber._id,
      _topicId: topic._id,
      topicKey: topic.key,
      externalSubscriberId: subscriber.subscriberId,
      rules,
      rulesHash,
      workflows: subscriptionsWorkflows,
    }));
  }
}
