import { Injectable } from '@nestjs/common';
import { GetPreferences, GetPreferencesCommand, InstrumentUsecase, PinoLogger } from '@novu/application-generic';
import { PreferencesRepository } from '@novu/dal';
import { PreferencesTypeEnum, SeverityLevelEnum } from '@novu/shared';
import { RulesLogic } from 'json-logic-js';
import { SubscriptionPreferenceDto } from '../../dtos/create-topic-subscriptions-response.dto';
import { CreateSubscriptionPreferencesCommand } from './create-subscription-preferences.command';

@Injectable()
export class CreateSubscriptionPreferencesUsecase {
  constructor(
    private preferencesRepository: PreferencesRepository,
    private getPreferences: GetPreferences,
    private logger: PinoLogger
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @InstrumentUsecase()
  async execute(command: CreateSubscriptionPreferencesCommand): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || command.preferences.length === 0) {
      return undefined;
    }

    const hasConditions = command.preferences.some(
      (pref) => pref.condition !== undefined || pref.enabled !== undefined
    );

    if (hasConditions) {
      return await this.createPreferencesWithConditions(command);
    }

    return await this.createPreferencesWithoutConditions(command);
  }

  private async createPreferencesWithConditions(
    command: CreateSubscriptionPreferencesCommand
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || command.workflows.length === 0) {
      return undefined;
    }

    const preferencesResult: SubscriptionPreferenceDto[] = [];

    for (const workflow of command.workflows) {
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
        _subscriberId: command._subscriberId,
        _templateId: workflow._id,
        _topicSubscriptionId: command.subscriptionId,
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
    command: CreateSubscriptionPreferencesCommand
  ): Promise<SubscriptionPreferenceDto[] | undefined> {
    if (!command.preferences || command.workflows.length === 0) {
      return undefined;
    }

    const preferencesResult: SubscriptionPreferenceDto[] = [];

    for (const workflow of command.workflows) {
      const preferenceResponse = await this.getPreferences.safeExecute(
        GetPreferencesCommand.create({
          environmentId: command.environmentId,
          organizationId: command.organizationId,
          templateId: workflow._id,
          subscriberId: command._subscriberId,
        })
      );

      if (preferenceResponse) {
        await this.preferencesRepository.create({
          _environmentId: command.environmentId,
          _organizationId: command.organizationId,
          _subscriberId: command._subscriberId,
          _templateId: workflow._id,
          _topicSubscriptionId: command.subscriptionId,
          type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
          preferences: preferenceResponse.preferences,
        });

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
}
