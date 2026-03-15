import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import {
  AnalyticsService,
  deepMerge,
  FeatureFlagsService,
  filteredPreference,
  GetPreferences,
  InstrumentUsecase,
  MergePreferences,
  MergePreferencesCommand,
  overridePreferences,
  SendWebhookMessage,
  UpsertPreferences,
} from '@novu/application-generic';
import {
  BaseRepository,
  ContextRepository,
  EnvironmentEntity,
  EnvironmentRepository,
  NotificationTemplateEntity,
  NotificationTemplateRepository,
  PreferencesEntity,
  PreferencesRepository,
  SubscriberEntity,
  SubscriberRepository,
} from '@novu/dal';
import {
  ContextPayload,
  FeatureFlagsKeysEnum,
  IPreferenceChannels,
  PreferenceLevelEnum,
  PreferencesTypeEnum,
  SeverityLevelEnum,
  StepTypeEnum,
  WebhookEventEnum,
  WebhookObjectTypeEnum,
  WorkflowPreferences,
  WorkflowPreferencesPartial,
  buildWorkflowPreferences,
} from '@novu/shared';
import { BulkUpdatePreferenceItemDto } from '../../dtos/bulk-update-preferences-request.dto';
import { InboxPreference } from '../../utils/types';
import { UpdatePreferencesCommand } from '../update-preferences/update-preferences.command';
import { UpdatePreferences } from '../update-preferences/update-preferences.usecase';
import { BulkUpdatePreferencesCommand } from './bulk-update-preferences.command';

const MAX_BULK_LIMIT = 100;

@Injectable()
export class BulkUpdatePreferences {
  constructor(
    private notificationTemplateRepository: NotificationTemplateRepository,
    private subscriberRepository: SubscriberRepository,
    private analyticsService: AnalyticsService,
    private updatePreferencesUsecase: UpdatePreferences,
    private environmentRepository: EnvironmentRepository,
    private contextRepository: ContextRepository,
    private featureFlagsService: FeatureFlagsService,
    private preferencesRepository: PreferencesRepository,
    private upsertPreferences: UpsertPreferences,
    private sendWebhookMessage: SendWebhookMessage
  ) {}

  @InstrumentUsecase()
  async execute(command: BulkUpdatePreferencesCommand): Promise<InboxPreference[]> {
    const contextKeys = await this.resolveContexts(command.environmentId, command.organizationId, command.context);

    const subscriber = await this.subscriberRepository.findBySubscriberId(command.environmentId, command.subscriberId);
    if (!subscriber) throw new NotFoundException(`Subscriber with id: ${command.subscriberId} is not found`);

    if (command.preferences.length === 0) {
      throw new BadRequestException('No preferences provided for bulk update');
    }

    if (command.preferences.length > MAX_BULK_LIMIT) {
      throw new UnprocessableEntityException(`preferences must contain no more than ${MAX_BULK_LIMIT} elements`);
    }

    const allWorkflowIds = command.preferences.map((preference) => preference.workflowId);
    const workflowInternalIds = allWorkflowIds.filter((id) => BaseRepository.isInternalId(id));
    const workflowIdentifiers = allWorkflowIds.filter((id) => !BaseRepository.isInternalId(id));

    const dbWorkflows = await this.notificationTemplateRepository.findForBulkPreferences(
      command.environmentId,
      workflowInternalIds,
      workflowIdentifiers
    );

    const allValidWorkflowsMap = new Map<string, NotificationTemplateEntity>();
    if (dbWorkflows && dbWorkflows.length > 0) {
      for (const workflow of dbWorkflows) {
        allValidWorkflowsMap.set(workflow._id, workflow);

        if (workflow.triggers?.[0]?.identifier) {
          allValidWorkflowsMap.set(workflow.triggers[0].identifier, workflow);
        }
      }
    }

    const invalidWorkflowIds = allWorkflowIds.filter((id) => !allValidWorkflowsMap.has(id));
    if (invalidWorkflowIds.length > 0) {
      throw new NotFoundException(`Workflows with ids: ${invalidWorkflowIds.join(', ')} not found`);
    }

    const criticalWorkflows = dbWorkflows.filter((workflow) => workflow.critical);
    if (criticalWorkflows.length > 0) {
      const criticalWorkflowIds = criticalWorkflows.map((workflow) => workflow._id);
      throw new BadRequestException(`Critical workflows with ids: ${criticalWorkflowIds.join(', ')} cannot be updated`);
    }

    const workflowPreferencesMap = new Map<
      string,
      { preference: BulkUpdatePreferenceItemDto; workflow: NotificationTemplateEntity }
    >();
    for (const preference of command.preferences) {
      const workflow = allValidWorkflowsMap.get(preference.workflowId);
      if (workflow) {
        workflowPreferencesMap.set(workflow._id, {
          preference,
          workflow,
        });
      }
    }

    const environment = await this.environmentRepository.findOne({
      _id: command.environmentId,
    });

    const hasSubscriptionPreferences = Array.from(workflowPreferencesMap.values()).some(
      ({ preference }) => preference.subscriptionIdentifier
    );

    if (hasSubscriptionPreferences) {
      return this.executePerItem(command, workflowPreferencesMap, contextKeys, subscriber, environment!);
    }

    return this.executeBulkOptimized(command, workflowPreferencesMap, contextKeys, subscriber, environment!);
  }

  private async executePerItem(
    command: BulkUpdatePreferencesCommand,
    workflowPreferencesMap: Map<string, { preference: BulkUpdatePreferenceItemDto; workflow: NotificationTemplateEntity }>,
    contextKeys: string[] | undefined,
    subscriber: SubscriberEntity,
    environment: EnvironmentEntity
  ): Promise<InboxPreference[]> {
    const updatePromises = Array.from(workflowPreferencesMap.entries()).map(
      async ([workflowId, { preference, workflow }]) => {
        const isUpdatingSubscriptionPreference =
          preference.subscriptionIdentifier &&
          (typeof preference.enabled !== 'undefined' || typeof preference.condition !== 'undefined');

        return this.updatePreferencesUsecase.execute(
          UpdatePreferencesCommand.create({
            organizationId: command.organizationId,
            subscriberId: command.subscriberId,
            environmentId: command.environmentId,
            contextKeys,
            level: PreferenceLevelEnum.TEMPLATE,
            subscriptionIdentifier: preference.subscriptionIdentifier,
            ...(isUpdatingSubscriptionPreference && {
              all: {
                ...(typeof preference.enabled !== 'undefined' && { enabled: preference.enabled }),
                ...(typeof preference.condition !== 'undefined' && { condition: preference.condition }),
              },
            }),
            chat: preference.chat,
            email: preference.email,
            in_app: preference.in_app,
            push: preference.push,
            sms: preference.sms,
            workflowIdOrIdentifier: workflowId,
            workflow,
            includeInactiveChannels: false,
            subscriber,
            environment,
          })
        );
      }
    );

    return Promise.all(updatePromises);
  }

  private async executeBulkOptimized(
    command: BulkUpdatePreferencesCommand,
    workflowPreferencesMap: Map<string, { preference: BulkUpdatePreferenceItemDto; workflow: NotificationTemplateEntity }>,
    contextKeys: string[] | undefined,
    subscriber: SubscriberEntity,
    environment: EnvironmentEntity
  ): Promise<InboxPreference[]> {
    const templateIds = Array.from(workflowPreferencesMap.keys());

    const useContextFiltering = await this.featureFlagsService.getFlag({
      key: FeatureFlagsKeysEnum.IS_CONTEXT_PREFERENCES_ENABLED,
      defaultValue: false,
      organization: { _id: command.organizationId },
    });

    const contextQuery = this.preferencesRepository.buildContextExactMatchQuery(contextKeys, {
      enabled: useContextFiltering,
    });

    const [existingSubscriberWorkflowPrefs, subscriberGlobalPref, workflowLevelPrefs] = await Promise.all([
      this.preferencesRepository.find({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        _subscriberId: subscriber._id,
        _templateId: { $in: templateIds },
        type: PreferencesTypeEnum.SUBSCRIBER_WORKFLOW,
        ...contextQuery,
      }),
      this.preferencesRepository.findOne({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        _subscriberId: subscriber._id,
        type: PreferencesTypeEnum.SUBSCRIBER_GLOBAL,
        ...contextQuery,
      }),
      this.preferencesRepository.find(
        {
          _environmentId: command.environmentId,
          _organizationId: command.organizationId,
          _templateId: { $in: templateIds },
          type: { $in: [PreferencesTypeEnum.WORKFLOW_RESOURCE, PreferencesTypeEnum.USER_WORKFLOW] },
        },
        undefined,
        { readPreference: 'secondaryPreferred' as const }
      ),
    ]);

    const existingSubWorkflowPrefMap = new Map<string, PreferencesEntity>();
    for (const pref of existingSubscriberWorkflowPrefs) {
      if (pref._templateId) {
        existingSubWorkflowPrefMap.set(pref._templateId, pref);
      }
    }

    const workflowResourcePrefMap = new Map<string, PreferencesEntity>();
    const workflowUserPrefMap = new Map<string, PreferencesEntity>();
    for (const pref of workflowLevelPrefs) {
      if (!pref._templateId) continue;
      if (pref.type === PreferencesTypeEnum.WORKFLOW_RESOURCE) {
        workflowResourcePrefMap.set(pref._templateId, pref);
      } else {
        workflowUserPrefMap.set(pref._templateId, pref);
      }
    }

    const isContextScoped = true;
    const bulkOps: Array<{
      updateOne: {
        filter: Record<string, unknown>;
        update: Record<string, unknown>;
        upsert?: boolean;
      };
    }> = [];
    const computedSubscriberWorkflowPrefs = new Map<string, WorkflowPreferencesPartial>();

    for (const [workflowId, { preference }] of workflowPreferencesMap) {
      const channelPreferences = buildChannelPreferences(preference);
      const newPreferences: WorkflowPreferencesPartial = {
        channels: Object.entries(channelPreferences).reduce(
          (acc, [channel, enabled]) => ({
            ...acc,
            [channel]: { enabled },
          }),
          {} as WorkflowPreferences['channels']
        ),
      };

      const existing = existingSubWorkflowPrefMap.get(workflowId);

      if (existing) {
        const mergedPreferences = deepMerge([
          existing.preferences as Record<string, unknown>,
          newPreferences as Record<string, unknown>,
        ]);
        computedSubscriberWorkflowPrefs.set(workflowId, mergedPreferences as WorkflowPreferencesPartial);

        bulkOps.push({
          updateOne: {
            filter: { _id: existing._id, _environmentId: command.environmentId },
            update: {
              $set: {
                preferences: mergedPreferences,
              },
            },
          },
        });
      } else {
        computedSubscriberWorkflowPrefs.set(workflowId, newPreferences);

        bulkOps.push({
          updateOne: {
            filter: {
              _environmentId: command.environmentId,
              _organizationId: command.organizationId,
              _subscriberId: subscriber._id,
              _templateId: workflowId,
              type: PreferencesTypeEnum.SUBSCRIBER_WORKFLOW,
              ...contextQuery,
            },
            update: {
              $setOnInsert: {
                _environmentId: command.environmentId,
                _organizationId: command.organizationId,
                _subscriberId: subscriber._id,
                _templateId: workflowId,
                type: PreferencesTypeEnum.SUBSCRIBER_WORKFLOW,
                ...(useContextFiltering && isContextScoped ? { contextKeys: contextKeys ?? [] } : {}),
              },
              $set: {
                preferences: newPreferences,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await this.preferencesRepository.bulkWrite(bulkOps);
    }

    const results: InboxPreference[] = [];

    for (const [workflowId, { workflow }] of workflowPreferencesMap) {
      const subscriberWorkflowPref = computedSubscriberWorkflowPrefs.get(workflowId);
      const workflowResourcePref = workflowResourcePrefMap.get(workflowId);
      const workflowUserPref = workflowUserPrefMap.get(workflowId);

      const mergedPreferences = MergePreferences.execute(
        MergePreferencesCommand.create({
          ...(workflowResourcePref ? { workflowResourcePreference: workflowResourcePref as any } : {}),
          ...(workflowUserPref ? { workflowUserPreference: workflowUserPref as any } : {}),
          ...(subscriberGlobalPref ? { subscriberGlobalPreference: subscriberGlobalPref as any } : {}),
          ...(subscriberWorkflowPref
            ? {
                subscriberWorkflowPreference: {
                  preferences: subscriberWorkflowPref,
                  type: PreferencesTypeEnum.SUBSCRIBER_WORKFLOW,
                  _environmentId: command.environmentId,
                  _organizationId: command.organizationId,
                } as any,
              }
            : {}),
        })
      );

      const mergedChannels = GetPreferences.mapWorkflowPreferencesToChannelPreferences(
        mergedPreferences.preferences || {}
      );

      const activeChannels = getActiveChannelsFromWorkflow(workflow);
      const initialChannels = filteredPreference(
        { email: true, sms: true, in_app: true, chat: true, push: true },
        activeChannels
      );

      const { channels } = overridePreferences(
        {
          template: workflow.preferenceSettings,
          subscriber: mergedChannels,
          workflowOverride: undefined,
        },
        initialChannels
      );

      const builtPreferences = buildWorkflowPreferences(mergedPreferences.preferences);

      const inboxPreference: InboxPreference = {
        level: PreferenceLevelEnum.TEMPLATE,
        enabled: builtPreferences.all.enabled,
        channels,
        workflow: {
          id: workflow._id,
          identifier: workflow.triggers[0]?.identifier,
          name: workflow.name,
          critical: workflow.critical,
          tags: workflow.tags,
          data: workflow.data,
          severity: workflow.severity ?? SeverityLevelEnum.NONE,
        },
      };

      results.push(inboxPreference);
    }

    for (const result of results) {
      this.sendWebhookMessage.execute({
        eventType: WebhookEventEnum.PREFERENCE_UPDATED,
        objectType: WebhookObjectTypeEnum.PREFERENCE,
        payload: {
          object: result,
          subscriberId: command.subscriberId,
        },
        organizationId: command.organizationId,
        environmentId: command.environmentId,
        environment,
      });
    }

    return results;
  }

  private async resolveContexts(
    environmentId: string,
    organizationId: string,
    context?: ContextPayload
  ): Promise<string[] | undefined> {
    const isEnabled = await this.featureFlagsService.getFlag({
      key: FeatureFlagsKeysEnum.IS_CONTEXT_PREFERENCES_ENABLED,
      defaultValue: false,
      organization: { _id: organizationId },
    });

    if (!isEnabled) {
      return undefined;
    }

    if (!context) {
      return [];
    }

    const contexts = await this.contextRepository.findOrCreateContextsFromPayload(
      environmentId,
      organizationId,
      context
    );

    return contexts.map((ctx) => ctx.key);
  }
}

function buildChannelPreferences(preference: BulkUpdatePreferenceItemDto): IPreferenceChannels {
  return {
    ...(preference.chat !== undefined && { chat: preference.chat }),
    ...(preference.email !== undefined && { email: preference.email }),
    ...(preference.in_app !== undefined && { in_app: preference.in_app }),
    ...(preference.push !== undefined && { push: preference.push }),
    ...(preference.sms !== undefined && { sms: preference.sms }),
  };
}

function getActiveChannelsFromWorkflow(workflow: NotificationTemplateEntity): string[] {
  const activeSteps = (workflow.steps || []).filter((step) => step.active === true);

  const channels = activeSteps
    .map((item) => item.template?.type as StepTypeEnum)
    .filter(Boolean)
    .reduce<StepTypeEnum[]>((list, channel) => {
      if (list.includes(channel)) {
        return list;
      }
      list.push(channel);

      return list;
    }, []);

  return channels as unknown as string[];
}
