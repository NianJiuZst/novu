import { Injectable, NotFoundException } from '@nestjs/common';
import {
  createDeterministicHash,
  GetPreferences,
  GetPreferencesCommand,
  InstrumentUsecase,
  PinoLogger,
} from '@novu/application-generic';
import {
  BaseRepository,
  CreateTopicSubscribersEntity,
  NotificationTemplateEntity,
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
import _ from 'lodash';
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
    const workflows = await this.validateAndFetchWorkflows(
      command.preferences,
      command.environmentId,
      command.organizationId
    );
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
      preferencesHash?: string | null;
    } = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicId: topic._id,
      _subscriberId: { $in: foundSubscribers.map((sub) => sub._id) },
      ...(preferencesHash ? { preferencesHash } : { preferencesHash: null }),
    };

    const existingSubscriptions = await this.topicSubscribersRepository.find(
      existingSubscriptionsQuery as Parameters<typeof this.topicSubscribersRepository.find>[0]
    );

    // Create topic subscriptions for subscribers that don't already have a subscription
    const existingSubscriberIds = existingSubscriptions.map((sub) => sub._subscriberId.toString());
    let subscribersToCreate = foundSubscribers.filter((sub) => !existingSubscriberIds.includes(sub._id.toString()));

    // Validate limit only for subscribers that need new subscriptions
    if (subscribersToCreate.length > 0) {
      const { validSubscribers: validSubscribersToCreate, limitErrors: limitErrorsToCreate } =
        await this.validateSubscriptionLimit(topic, subscribersToCreate, command.environmentId, command.organizationId);

      errors.push(...limitErrorsToCreate);

      subscribersToCreate = validSubscribersToCreate;
    }

    for (const subscription of existingSubscriptions) {
      const subscriber = foundSubscribers.find((sub) => sub._id.toString() === subscription._subscriberId.toString());
      const preferences = await this.fetchPreferencesForSubscription(command, subscription, workflows);

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

        const preferences = await this.createPreferencesForSubscription(command, subscription, workflows);

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

      for (const subscription of newSubscriptions.updated) {
        const subscriber = foundSubscribers.find((sub) => sub._id.toString() === subscription._subscriberId.toString());

        const preferences = await this.fetchPreferencesForSubscription(command, subscription, workflows);

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
      const count = subscriberCountMap.get(subscriber._id.toString()) || 0;

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
    subscription: TopicSubscribersEntity,
    workflows: NotificationTemplateEntity[]
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || command.preferences.length === 0 || workflows.length === 0) {
      return undefined;
    }

    const preferencesEntities = await this.preferencesRepository.find({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicSubscriptionId: subscription._id,
      _subscriberId: subscription._subscriberId,
      _templateId: { $in: workflows.map((w) => w._id) },
      type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
    });

    if (preferencesEntities.length === 0) {
      return undefined;
    }

    return preferencesEntities
      .map((pref) => {
        const workflowId = pref._templateId?.toString();
        if (!workflowId) {
          return null;
        }

        const workflow = workflows.find((w) => w._id === workflowId);
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
    subscription: TopicSubscribersEntity,
    workflows: NotificationTemplateEntity[]
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || command.preferences.length === 0) {
      return undefined;
    }

    const hasConditions = command.preferences.some(
      (pref) => pref.condition !== undefined || pref.enabled !== undefined
    );

    if (hasConditions) {
      return await this.createPreferencesWithConditions(command, subscription, workflows);
    }

    return await this.createPreferencesWithoutConditions(command, subscription, workflows);
  }

  private async createPreferencesWithConditions(
    command: CreateTopicSubscriptionsCommand,
    subscription: TopicSubscribersEntity,
    workflows: NotificationTemplateEntity[]
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || workflows.length === 0) {
      return undefined;
    }

    const preferencesResult: SubscriptionPreferenceDto[] = [];

    for (const workflow of workflows) {
      const preferenceFilter = command.preferences.find((pref) => {
        if (pref.filter.tags && pref.filter.tags.length > 0) {
          return workflow.tags && pref.filter.tags.some((tag) => workflow.tags.includes(tag));
        }
        if (pref.filter.workflowIds && pref.filter.workflowIds.length > 0) {
          return pref.filter.workflowIds.some((id) => {
            const workflowIdentifier = workflow.triggers?.[0]?.identifier;
            return id === workflow._id || id === workflowIdentifier;
          });
        }
        return false;
      });

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
        _templateId: workflow._id,
        _topicSubscriptionId: subscription._id,
        type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
        preferences: workflowPreferences,
      });

      if (createdPreference) {
        preferencesResult.push({
          workflow: {
            id: workflow._id,
            identifier: workflow.triggers?.[0]?.identifier || '',
            name: workflow.name || '',
            critical: workflow.critical || false,
            tags: workflow.tags,
            data: workflow.data,
            severity: workflow.severity || SeverityLevelEnum.NONE,
          },
          enabled: createdPreference.preferences?.all?.enabled ?? true,
          condition: createdPreference.preferences?.all?.condition as RulesLogic | undefined,
        });
      }
    }

    return preferencesResult.length > 0 ? preferencesResult : undefined;
  }

  private async createPreferencesWithoutConditions(
    command: CreateTopicSubscriptionsCommand,
    subscription: TopicSubscribersEntity,
    workflows: NotificationTemplateEntity[]
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || workflows.length === 0) {
      return undefined;
    }

    const preferencesResult: SubscriptionPreferenceDto[] = [];

    for (const workflow of workflows) {
      const preferenceResponse = await this.getPreferences.safeExecute(
        GetPreferencesCommand.create({
          environmentId: command.environmentId,
          organizationId: command.organizationId,
          templateId: workflow._id,
          subscriberId: subscription._subscriberId,
        })
      );

      if (preferenceResponse) {
        preferencesResult.push({
          workflow: {
            id: workflow._id,
            identifier: workflow.triggers?.[0]?.identifier || '',
            name: workflow.name || '',
            critical: workflow.critical || false,
            tags: workflow.tags,
            data: workflow.data,
            severity: workflow.severity || SeverityLevelEnum.NONE,
          },
          enabled: preferenceResponse.preferences?.all?.enabled ?? true,
        });
      }
    }

    return preferencesResult.length > 0 ? preferencesResult : undefined;
  }

  private async validateAndFetchWorkflows(
    preferences: GroupPreferenceFilterDto[] | undefined,
    environmentId: string,
    organizationId: string
  ): Promise<NotificationTemplateEntity[]> {
    let workflowsById: NotificationTemplateEntity[] = [];
    let workflowsByIdentifier: NotificationTemplateEntity[] = [];
    const workflowsByTags: NotificationTemplateEntity[] = [];

    if (!preferences || preferences.length === 0) {
      return [];
    }

    for (const pref of preferences) {
      const missingWorkflowIds: string[] = [];
      const missingTags: string[] = [];

      const fetchWorkflowIdsByIdsResult = await this.validateAndFetchWorkflowsByIds(
        pref.filter.workflowIds,
        environmentId
      );
      workflowsById = fetchWorkflowIdsByIdsResult.workflowsById;
      workflowsByIdentifier = fetchWorkflowIdsByIdsResult.workflowsByIdentifier;
      missingWorkflowIds.push(...fetchWorkflowIdsByIdsResult.missingWorkflowIds);

      const findByTagsResult = await this.findByTags(pref, organizationId, environmentId);
      workflowsByTags.push(...findByTagsResult.workflowsByTags);
      missingTags.push(...findByTagsResult.missingTags);

      if (missingWorkflowIds.length > 0 || missingTags.length > 0) {
        const errorMessages: string[] = [];

        if (missingWorkflowIds.length > 0) {
          errorMessages.push(
            `Workflows not found: ${missingWorkflowIds.join(', ')}. Please verify the workflow IDs or identifiers exist.`
          );
        }

        if (missingTags.length > 0) {
          errorMessages.push(
            `No workflows found for tags: ${missingTags.join(', ')}. Please verify the tags exist and have associated workflows.`
          );
        }

        throw new NotFoundException(errorMessages.join(' '));
      }
    }

    return _.uniqBy([...workflowsById, ...workflowsByIdentifier, ...workflowsByTags], '_id');
  }

  private async findByTags(
    pref: GroupPreferenceFilterDto,
    organizationId: string,
    environmentId: string
  ): Promise<{ workflowsByTags: NotificationTemplateEntity[]; missingTags: string[] }> {
    const missingTags: string[] = [];
    let workflowsByTags: NotificationTemplateEntity[] = [];

    if (pref.filter.tags && pref.filter.tags.length > 0) {
      workflowsByTags = await this.notificationTemplateRepository.filterActive({
        organizationId,
        environmentId,
        tags: pref.filter.tags,
      });

      for (const tag of pref.filter.tags) {
        const hasWorkflowWithTag = workflowsByTags.some((workflow) => workflow.tags?.includes(tag));
        if (!hasWorkflowWithTag) {
          missingTags.push(tag);
        }
      }
    }
    return { workflowsByTags, missingTags };
  }

  private async validateAndFetchWorkflowsByIds(
    workflowIds: string[] | undefined,
    environmentId: string
  ): Promise<{
    workflowsById: NotificationTemplateEntity[];
    workflowsByIdentifier: NotificationTemplateEntity[];
    missingWorkflowIds: string[];
  }> {
    if (!workflowIds || workflowIds.length === 0) {
      return {
        workflowsById: [],
        workflowsByIdentifier: [],
        missingWorkflowIds: [],
      };
    }

    const internalIds: string[] = [];
    const workflowIdentifiers: string[] = [];

    for (const workflowId of workflowIds) {
      if (BaseRepository.isInternalId(workflowId)) {
        internalIds.push(workflowId);
      } else {
        workflowIdentifiers.push(workflowId);
      }
    }

    let workflowsById: NotificationTemplateEntity[] = [];
    let workflowsByIdentifier: NotificationTemplateEntity[] = [];
    const missingWorkflowIds: string[] = [];

    if (internalIds.length > 0) {
      const uniqueWorkflowIds = [...new Set(internalIds)];
      workflowsById = await this.notificationTemplateRepository.find({
        _id: { $in: uniqueWorkflowIds },
        _environmentId: environmentId,
      });

      const foundWorkflowIds = new Set(workflowsById.map((w) => w._id.toString()));

      for (const workflowId of uniqueWorkflowIds) {
        if (!foundWorkflowIds.has(workflowId)) {
          missingWorkflowIds.push(workflowId);
        }
      }
    }

    if (workflowIdentifiers.length > 0) {
      const uniqueWorkflowIdentifiers = [...new Set(workflowIdentifiers)];
      workflowsByIdentifier = await this.notificationTemplateRepository.findByTriggerIdentifierBulk(
        environmentId,
        uniqueWorkflowIdentifiers
      );

      const foundIdentifiers = new Set(workflowsByIdentifier.map((w) => w.triggers?.[0]?.identifier).filter(Boolean));

      for (const identifier of uniqueWorkflowIdentifiers) {
        if (!foundIdentifiers.has(identifier)) {
          missingWorkflowIds.push(identifier);
        }
      }
    }

    return { workflowsById, workflowsByIdentifier, missingWorkflowIds };
  }
}
