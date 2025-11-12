import { Injectable, NotFoundException } from '@nestjs/common';
import {
  createDeterministicHash,
  GetPreferences,
  GetPreferencesCommand,
  InstrumentUsecase,
  PinoLogger,
} from '@novu/application-generic';
import {
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
import { Types } from 'mongoose';
import { GroupPreferenceFilterDto } from '../../dtos/create-topic-subscriptions.dto';
import { SubscriptionDto, SubscriptionPreferenceDto } from '../../dtos/create-topic-subscriptions-response.dto';
import { UpdateTopicSubscriptionCommand } from './update-topic-subscription.command';

@Injectable()
export class UpdateTopicSubscriptionUsecase {
  constructor(
    private topicRepository: TopicRepository,
    private topicSubscribersRepository: TopicSubscribersRepository,
    private subscriberRepository: SubscriberRepository,
    private preferencesRepository: PreferencesRepository,
    private notificationTemplateRepository: NotificationTemplateRepository,
    private getPreferences: GetPreferences,
    private logger: PinoLogger
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @InstrumentUsecase()
  async execute(command: UpdateTopicSubscriptionCommand): Promise<SubscriptionDto> {
    const topic = await this.topicRepository.findTopicByKey(
      command.topicKey,
      command.organizationId,
      command.environmentId
    );

    if (!topic) {
      throw new NotFoundException(`Topic with key ${command.topicKey} not found`);
    }

    const subscription = await this.topicSubscribersRepository.findOne({
      _id: command.subscriptionId,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicId: topic._id,
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${command.subscriptionId} not found for topic ${command.topicKey}`
      );
    }

    const updateData: Partial<TopicSubscribersEntity> = {};
    let preferencesHash: string | undefined;

    if (command.preferences !== undefined) {
      preferencesHash = createDeterministicHash(command.preferences);
      updateData.preferencesHash = preferencesHash;

      await this.updatePreferencesForSubscription(command, subscription);
    }

    if (command.name !== undefined) {
      updateData.name = command.name;
    }

    if (Object.keys(updateData).length > 0) {
      await this.topicSubscribersRepository.update(
        {
          _id: command.subscriptionId,
          _environmentId: command.environmentId,
          _organizationId: command.organizationId,
        },
        updateData
      );
    }

    const updatedSubscription = await this.topicSubscribersRepository.findOne({
      _id: command.subscriptionId,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    if (!updatedSubscription) {
      throw new NotFoundException(`Subscription with ID ${command.subscriptionId} could not be retrieved after update`);
    }

    const subscriber = await this.subscriberRepository.findOne({
      _id: updatedSubscription._subscriberId,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    const preferences = await this.fetchPreferencesForSubscription(
      updatedSubscription,
      command.environmentId,
      command.organizationId
    );

    return this.mapSubscriptionToDto(updatedSubscription, subscriber, topic, preferences);
  }

  private async updatePreferencesForSubscription(
    command: UpdateTopicSubscriptionCommand,
    subscription: TopicSubscribersEntity
  ): Promise<void> {
    // Delete existing preferences before recreating to handle removals and changes
    await this.preferencesRepository.delete({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicSubscriptionId: subscription._id,
      _subscriberId: subscription._subscriberId,
      type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
    });

    if (!command.preferences || command.preferences.length === 0) {
      return;
    }

    const hasConditions = command.preferences.some(
      (pref) => pref.condition !== undefined || pref.enabled !== undefined
    );

    if (hasConditions) {
      await this.createPreferencesWithConditions(command, subscription);
    } else {
      await this.createPreferencesWithoutConditions(command, subscription);
    }
  }

  private async createPreferencesWithConditions(
    command: UpdateTopicSubscriptionCommand,
    subscription: TopicSubscribersEntity
  ): Promise<void> {
    if (!command.preferences) {
      return;
    }

    const { workflowIds, identifierToObjectIdMap } = await this.extractWorkflowIdsWithMapping(
      command.preferences,
      command.environmentId,
      command.organizationId
    );

    if (workflowIds.length === 0) {
      return;
    }

    for (const workflowId of workflowIds) {
      const preferenceFilter = command.preferences.find((pref) => {
        if (pref.filter.tags && pref.filter.tags.length > 0) {
          return true;
        }
        if (pref.filter.workflowIds && pref.filter.workflowIds.length > 0) {
          return pref.filter.workflowIds.some((id) => {
            const resolvedId = identifierToObjectIdMap.get(id) || id;
            return resolvedId === workflowId;
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

      await this.preferencesRepository.create({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        _subscriberId: subscription._subscriberId,
        _templateId: workflowId,
        _topicSubscriptionId: subscription._id,
        type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
        preferences: workflowPreferences,
      });
    }
  }

  private async createPreferencesWithoutConditions(
    command: UpdateTopicSubscriptionCommand,
    subscription: TopicSubscribersEntity
  ): Promise<void> {
    if (!command.preferences) {
      return;
    }

    const workflowIds = await this.extractWorkflowIds(
      command.preferences,
      command.environmentId,
      command.organizationId
    );
    if (workflowIds.length === 0) {
      return;
    }

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
        await this.preferencesRepository.create({
          _environmentId: command.environmentId,
          _organizationId: command.organizationId,
          _subscriberId: subscription._subscriberId,
          _templateId: workflowId,
          _topicSubscriptionId: subscription._id,
          type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
          preferences: preferenceResponse.preferences,
        });
      }
    }
  }

  private async fetchPreferencesForSubscription(
    subscription: TopicSubscribersEntity,
    environmentId: string,
    organizationId: string
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    const existingPreferences = await this.preferencesRepository.find({
      _environmentId: environmentId,
      _organizationId: organizationId,
      _topicSubscriptionId: subscription._id,
      _subscriberId: subscription._subscriberId,
      type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
    });

    if (existingPreferences.length === 0) {
      return undefined;
    }

    const workflowIds = existingPreferences
      .map((pref) => pref._templateId?.toString())
      .filter((id): id is string => id !== null);

    if (workflowIds.length === 0) {
      return undefined;
    }

    const workflows = await Promise.all(
      workflowIds.map((id) => this.notificationTemplateRepository.findById(id, environmentId).catch(() => null))
    );

    const workflowMap = new Map(workflows.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w._id, w]));

    return existingPreferences
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

  private async extractWorkflowIds(
    preferences: GroupPreferenceFilterDto[],
    environmentId: string,
    organizationId: string
  ): Promise<string[]> {
    const result = await this.extractWorkflowIdsWithMapping(preferences, environmentId, organizationId);
    return result.workflowIds;
  }

  private async extractWorkflowIdsWithMapping(
    preferences: GroupPreferenceFilterDto[],
    environmentId: string,
    organizationId: string
  ): Promise<{ workflowIds: string[]; identifierToObjectIdMap: Map<string, string> }> {
    if (!preferences) {
      return { workflowIds: [], identifierToObjectIdMap: new Map() };
    }

    const workflowIds: string[] = [];
    const workflowIdentifiers: string[] = [];
    const identifierToObjectIdMap = new Map<string, string>();

    for (const pref of preferences) {
      if (pref.filter.workflowIds && pref.filter.workflowIds.length > 0) {
        for (const workflowId of pref.filter.workflowIds) {
          if (Types.ObjectId.isValid(workflowId)) {
            workflowIds.push(workflowId);
            identifierToObjectIdMap.set(workflowId, workflowId);
          } else {
            workflowIdentifiers.push(workflowId);
          }
        }
      }

      if (pref.filter.tags && pref.filter.tags.length > 0) {
        const workflows = await this.notificationTemplateRepository.filterActive({
          organizationId,
          environmentId,
          tags: pref.filter.tags,
        });

        for (const workflow of workflows) {
          workflowIds.push(workflow._id);
          if (workflow.triggers?.[0]?.identifier) {
            identifierToObjectIdMap.set(workflow.triggers[0].identifier, workflow._id);
          }
        }
      }
    }

    if (workflowIdentifiers.length > 0) {
      const workflowsByIdentifier = await this.notificationTemplateRepository.findByTriggerIdentifierBulk(
        environmentId,
        workflowIdentifiers
      );
      const workflowByIdentifierMap = new Map<string, string>();
      for (const workflow of workflowsByIdentifier) {
        const identifier = workflow.triggers?.[0]?.identifier;
        if (identifier) {
          workflowByIdentifierMap.set(identifier, workflow._id);
        }
      }
      for (const identifier of workflowIdentifiers) {
        const objectId = workflowByIdentifierMap.get(identifier);
        if (objectId) {
          workflowIds.push(objectId);
          identifierToObjectIdMap.set(identifier, objectId);
        }
      }
    }

    return { workflowIds: [...new Set(workflowIds)], identifierToObjectIdMap };
  }

  private mapSubscriptionToDto(
    subscription: TopicSubscribersEntity,
    subscriber: SubscriberEntity | null,
    topic: TopicEntity,
    preferences?: SubscriptionPreferenceDto[]
  ): SubscriptionDto {
    return {
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
    };
  }
}
