import { Injectable } from '@nestjs/common';
import { PreferenceLevelEnum } from '@novu/shared';
import {
  type GetSubscriberGlobalPreference,
  GetSubscriberGlobalPreferenceCommand,
} from '../get-subscriber-global-preference';
import { type GetSubscriberPreference, GetSubscriberPreferenceCommand } from '../get-subscriber-preference';
import type { GetPreferencesByLevelCommand } from './get-preferences-by-level.command';

@Injectable()
export class GetPreferencesByLevel {
  constructor(
    private getSubscriberPreferenceUsecase: GetSubscriberPreference,
    private getSubscriberGlobalPreference: GetSubscriberGlobalPreference
  ) {}

  async execute(command: GetPreferencesByLevelCommand) {
    if (command.level === PreferenceLevelEnum.GLOBAL) {
      const globalPreferenceCommand = GetSubscriberGlobalPreferenceCommand.create({
        organizationId: command.organizationId,
        environmentId: command.environmentId,
        subscriberId: command.subscriberId,
        includeInactiveChannels: command.includeInactiveChannels,
      });
      const globalPreferences = await this.getSubscriberGlobalPreference.execute(globalPreferenceCommand);

      return [globalPreferences];
    }

    const preferenceCommand = GetSubscriberPreferenceCommand.create({
      organizationId: command.organizationId,
      environmentId: command.environmentId,
      subscriberId: command.subscriberId,
      includeInactiveChannels: command.includeInactiveChannels,
    });

    return await this.getSubscriberPreferenceUsecase.execute(preferenceCommand);
  }
}
