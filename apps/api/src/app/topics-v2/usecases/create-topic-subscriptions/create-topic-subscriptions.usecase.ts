import { Injectable } from '@nestjs/common';
import {
  createDeterministicHash,
  GetPreferences,
  GetPreferencesCommand,
  InstrumentUsecase,
  PinoLogger,
} from '@novu/application-generic';
import {
  CreateTopicSubscribersEntity,
  NotificationTemplateRepository,
  PreferencesRepository,
  SubscriberEntity,
  SubscriberRepository,
  TopicEntity,
  TopicRepository,
  TopicSubscribersEntity,
  TopicSubscribersRepository,
} from '@novu/dal';
import { PreferencesTypeEnum, SeverityLevelEnum } from '@novu/shared';
import { RulesLogic } from 'json-logic-js';
import { GroupPreferenceFilterDto } from '../../dtos/create-topic-subscriptions.dto';
import {
  CreateTopicSubscriptionsResponseDto,
  SubscriptionDto,
  SubscriptionErrorDto,
  SubscriptionPreferenceDto,
} from '../../dtos/create-topic-subscriptions-response.dto';
import { UpsertTopicUseCase } from '../upsert-topic/upsert-topic.usecase';
import { CreateTopicSubscriptionsCommand } from './create-topic-subscriptions.command';

@Injectable()
export class CreateTopicSubscriptionsUsecase {
  constructor(
    private topicRepository: TopicRepository,
    private topicSubscribersRepository: TopicSubscribersRepository,
    private subscriberRepository: SubscriberRepository,
    private preferencesRepository: PreferencesRepository,
    private notificationTemplateRepository: NotificationTemplateRepository,
    private upsertTopicUseCase: UpsertTopicUseCase,
    private getPreferences: GetPreferences,
    private logger: PinoLogger
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @InstrumentUsecase()
  async execute(command: CreateTopicSubscriptionsCommand): Promise<CreateTopicSubscriptionsResponseDto> {
    const topic = await this.upsertTopic(command);

    const errors: SubscriptionErrorDto[] = [];
    const subscriptionData: SubscriptionDto[] = [];

    const externalSubscriberIds = command.subscriberIds.map((id) => (typeof id === 'string' ? id : id.subscriberId));
    const foundSubscribers = await this.subscriberRepository.searchByExternalSubscriberIds({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      externalSubscriberIds,
    });

    const foundSubscriberIds = foundSubscribers.map((sub) => sub.subscriberId);
    const notFoundSubscriberIds = externalSubscriberIds.filter((id) => !foundSubscriberIds.includes(id));

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

    const preferencesHash = createDeterministicHash(command.preferences);

    const existingSubscriptionsQuery: {
      _environmentId: string;
      _organizationId: string;
      _topicId: string;
      _subscriberId: { $in: string[] };
      preferencesHash?: string;
    } = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicId: topic._id,
      _subscriberId: { $in: foundSubscribers.map((sub) => sub._id) },
    };

    if (preferencesHash) {
      existingSubscriptionsQuery.preferencesHash = preferencesHash;
    }

    const existingSubscriptions = await this.topicSubscribersRepository.find(
      existingSubscriptionsQuery as Parameters<typeof this.topicSubscribersRepository.find>[0]
    );

    // Create topic subscriptions for subscribers that don't already have a subscription
    const existingSubscriberIds = existingSubscriptions.map((sub) => sub._subscriberId.toString());
    const subscribersToCreate = foundSubscribers.filter((sub) => !existingSubscriberIds.includes(sub._id.toString()));

    for (const subscription of existingSubscriptions) {
      const subscriber = foundSubscribers.find((sub) => sub._id.toString() === subscription._subscriberId.toString());
      const preferences = await this.fetchPreferencesForSubscription(command, subscription);

      subscriptionData.push({
        _id: subscription._id.toString(),
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
              createdAt: subscriber.createdAt,
              updatedAt: subscriber.updatedAt,
            }
          : null,
        preferences,
        createdAt: subscription.createdAt ?? '',
        updatedAt: subscription.updatedAt ?? '',
      });
    }

    if (subscribersToCreate.length > 0) {
      const subscriptionsToCreate = this.buildSubscriptionEntity(
        topic,
        subscribersToCreate,
        preferencesHash,
        command.subscriberIds
      );
      const newSubscriptions = await this.topicSubscribersRepository.createSubscriptions(subscriptionsToCreate);

      for (const subscription of newSubscriptions.created) {
        const subscriber = foundSubscribers.find((sub) => sub._id.toString() === subscription._subscriberId.toString());

        const preferences = await this.createPreferencesForSubscription(command, subscription);

        subscriptionData.push({
          _id: subscription._id.toString(),
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
                createdAt: subscriber.createdAt,
                updatedAt: subscriber.updatedAt,
              }
            : null,
          preferences,
          createdAt: subscription.createdAt ?? '',
          updatedAt: subscription.updatedAt ?? '',
        });
      }
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

  private async upsertTopic(command: CreateTopicSubscriptionsCommand) {
    await this.upsertTopicUseCase.execute({
      environmentId: command.environmentId,
      organizationId: command.organizationId,
      userId: command.userId,
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
    return topic;
  }

  private buildSubscriptionEntity(
    topic: TopicEntity,
    subscribers: SubscriberEntity[],
    preferencesHash: string | undefined,
    subscriberIds: string[] | { identifier: string; subscriberId: string }[]
  ): CreateTopicSubscribersEntity[] {
    return subscribers.map((subscriber) => ({
      _environmentId: subscriber._environmentId,
      _organizationId: subscriber._organizationId,
      _subscriberId: subscriber._id,
      _topicId: topic._id,
      topicKey: topic.key,
      externalSubscriberId: subscriber.subscriberId,
      preferencesHash,
      identifier:
        this.findIdentifier(subscriberIds, subscriber.subscriberId) || `tk=${topic.key}:si=${subscriber.subscriberId}`,
    }));
  }

  private findIdentifier(
    subscriberIds: string[] | { identifier: string; subscriberId: string }[],
    subscriberId: string
  ): string | undefined {
    // fast fail if the subscriberIds is an array of objects and the first object has no identifier
    if (
      subscriberIds.length > 0 &&
      typeof subscriberIds[0] === 'object' &&
      subscriberIds[0] !== null &&
      'identifier' in subscriberIds[0] &&
      !subscriberIds[0]?.identifier
    ) {
      return undefined;
    }

    const found = subscriberIds.find((id) =>
      typeof id === 'string' ? id === subscriberId : id.subscriberId === subscriberId
    );
    return typeof found === 'object' ? found?.identifier : undefined;
  }

  private async fetchPreferencesForSubscription(
    command: CreateTopicSubscriptionsCommand,
    subscription: TopicSubscribersEntity
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || command.preferences.length === 0) {
      return undefined;
    }

    const workflowIds = await this.extractWorkflowIds(
      command.preferences,
      command.environmentId,
      command.organizationId
    );
    if (workflowIds.length === 0) {
      return undefined;
    }

    const preferencesEntities = await this.preferencesRepository.find({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicSubscriptionId: subscription._id,
      _subscriberId: subscription._subscriberId,
      _templateId: { $in: workflowIds },
      type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
    });

    if (preferencesEntities.length === 0) {
      return undefined;
    }

    const workflows = await Promise.all(
      workflowIds.map((id) => this.notificationTemplateRepository.findById(id, command.environmentId).catch(() => null))
    );

    const workflowMap = new Map(workflows.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w._id, w]));

    return preferencesEntities
      .map((pref) => {
        const workflowId = pref._templateId?.toString();
        if (!workflowId) {
          return null;
        }

        const workflow = workflowMap.get(workflowId);
        const preferences = pref.preferences;

        return {
          workflow: workflow
            ? {
                id: workflow._id,
                identifier: workflow.triggers?.[0]?.identifier || '',
                name: workflow.name || '',
                critical: workflow.critical || false,
                tags: workflow.tags,
                data: workflow.data,
                severity: workflow.severity || SeverityLevelEnum.NONE,
              }
            : undefined,
          enabled: preferences?.all?.enabled ?? true,
          condition: preferences?.all?.condition as RulesLogic | undefined,
        };
      })
      .filter((pref): pref is NonNullable<typeof pref> => pref !== null);
  }

  private async createPreferencesForSubscription(
    command: CreateTopicSubscriptionsCommand,
    subscription: TopicSubscribersEntity
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || command.preferences.length === 0) {
      return undefined;
    }

    const hasConditions = command.preferences.some(
      (pref) => pref.condition !== undefined || pref.enabled !== undefined
    );

    if (hasConditions) {
      return await this.createPreferencesWithConditions(command, subscription);
    }

    return await this.createPreferencesWithoutConditions(command, subscription);
  }

  private async createPreferencesWithConditions(
    command: CreateTopicSubscriptionsCommand,
    subscription: TopicSubscribersEntity
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences) {
      return undefined;
    }

    const workflowIds = await this.extractWorkflowIds(
      command.preferences,
      command.environmentId,
      command.organizationId
    );
    if (workflowIds.length === 0) {
      return undefined;
    }

    const workflows = await Promise.all(
      workflowIds.map((id) => this.notificationTemplateRepository.findById(id, command.environmentId))
    );

    const workflowMap = new Map(workflows.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w._id, w]));

    const preferencesResult: SubscriptionPreferenceDto[] = [];

    for (const workflowId of workflowIds) {
      const preferenceFilter = command.preferences.find(
        (pref) => pref.filter.workflowIds?.includes(workflowId) || (pref.filter.tags && pref.filter.tags.length > 0)
      );

      const condition = preferenceFilter?.condition;
      const enabled = preferenceFilter?.enabled ?? true;

      const workflowPreferences = {
        all: {
          enabled,
          ...(condition !== undefined && { condition }),
        },
      };

      const createdPreference = await this.preferencesRepository.create({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        _subscriberId: subscription._subscriberId,
        _templateId: workflowId,
        _topicSubscriptionId: subscription._id,
        type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
        preferences: workflowPreferences,
      });

      if (createdPreference) {
        const workflow = workflowMap.get(workflowId);

        preferencesResult.push({
          workflow: workflow
            ? {
                id: workflow._id,
                identifier: workflow.triggers?.[0]?.identifier || '',
                name: workflow.name || '',
                critical: workflow.critical || false,
                tags: workflow.tags,
                data: workflow.data,
                severity: workflow.severity || SeverityLevelEnum.NONE,
              }
            : undefined,
          enabled: createdPreference.preferences?.all?.enabled ?? true,
          condition: createdPreference.preferences?.all?.condition as RulesLogic | undefined,
        });
      }
    }

    return preferencesResult.length > 0 ? preferencesResult : undefined;
  }

  private async createPreferencesWithoutConditions(
    command: CreateTopicSubscriptionsCommand,
    subscription: TopicSubscribersEntity
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences) {
      return undefined;
    }

    const workflowIds = await this.extractWorkflowIds(
      command.preferences,
      command.environmentId,
      command.organizationId
    );
    if (workflowIds.length === 0) {
      return undefined;
    }

    const workflows = await Promise.all(
      workflowIds.map((id) => this.notificationTemplateRepository.findById(id, command.environmentId).catch(() => null))
    );

    const workflowMap = new Map(workflows.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w._id, w]));

    const preferencesResult: SubscriptionPreferenceDto[] = [];

    for (const workflowId of workflowIds) {
      const preferenceResponse = await this.getPreferences.safeExecute(
        GetPreferencesCommand.create({
          environmentId: command.environmentId,
          organizationId: command.organizationId,
          templateId: workflowId,
          subscriberId: subscription._subscriberId,
        })
      );

      if (preferenceResponse) {
        const workflow = workflowMap.get(workflowId);

        preferencesResult.push({
          workflow: workflow
            ? {
                id: workflow._id,
                identifier: workflow.triggers?.[0]?.identifier || '',
                name: workflow.name || '',
                critical: workflow.critical || false,
                tags: workflow.tags,
                data: workflow.data,
                severity: workflow.severity || SeverityLevelEnum.NONE,
              }
            : undefined,
          enabled: preferenceResponse.preferences?.all?.enabled ?? true,
        });
      }
    }

    return preferencesResult.length > 0 ? preferencesResult : undefined;
  }

  private async extractWorkflowIds(
    preferences: GroupPreferenceFilterDto[],
    environmentId: string,
    organizationId: string
  ): Promise<string[]> {
    if (!preferences) {
      return [];
    }

    const workflowIds: string[] = [];

    for (const pref of preferences) {
      if (pref.filter.workflowIds && pref.filter.workflowIds.length > 0) {
        workflowIds.push(...pref.filter.workflowIds);
      }

      if (pref.filter.tags && pref.filter.tags.length > 0) {
        const workflows = await this.notificationTemplateRepository.filterActive({
          organizationId,
          environmentId,
          tags: pref.filter.tags,
        });

        workflowIds.push(...workflows.map((workflow) => workflow._id));
      }
    }

    return [...new Set(workflowIds)];
  }
}
