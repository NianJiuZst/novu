import { InboxService } from '../api';

import { NovuEventEmitter } from '../event-emitter';
import { AIPreference, ChannelPreference, PreferenceLevel, Result, Workflow, Prettify } from '../types';
import { updatePreference } from './helpers';
import { PreferencesCache } from '../cache/preferences-cache';
import { UpdatePreferenceArgs } from './types';

type PreferenceLike = Pick<Preference, 'level' | 'enabled' | 'channels' | 'workflow' | 'aiPreference'>;

export class Preference {
  #emitter: NovuEventEmitter;
  #apiService: InboxService;
  #cache: PreferencesCache;
  #useCache: boolean;

  readonly level: PreferenceLevel;
  readonly enabled: boolean;
  readonly channels: ChannelPreference;
  readonly workflow?: Workflow;
  readonly aiPreference?: AIPreference;

  constructor(
    preference: PreferenceLike,
    {
      emitterInstance,
      inboxServiceInstance,
      cache,
      useCache,
    }: {
      emitterInstance: NovuEventEmitter;
      inboxServiceInstance: InboxService;
      cache: PreferencesCache;
      useCache: boolean;
    }
  ) {
    this.#emitter = emitterInstance;
    this.#apiService = inboxServiceInstance;
    this.#cache = cache;
    this.#useCache = useCache;
    this.level = preference.level;
    this.enabled = preference.enabled;
    this.channels = preference.channels;
    this.workflow = preference.workflow;
    this.aiPreference = preference.aiPreference;
  }

  update({
    channels,
    channelPreferences,
    aiPreference,
  }: Prettify<
    Pick<UpdatePreferenceArgs, 'channels'> & {
      /** @deprecated Use channels instead */
      channelPreferences?: ChannelPreference;
      aiPreference?: AIPreference;
    }
  >): Result<Preference> {
    return updatePreference({
      emitter: this.#emitter,
      apiService: this.#apiService,
      cache: this.#cache,
      useCache: this.#useCache,
      args: {
        workflowId: this.workflow?.id,
        channels: channels || channelPreferences,
        aiPreference,
        preference: this,
      },
    });
  }
}
