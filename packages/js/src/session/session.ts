import { NovuEventEmitter } from '../event-emitter';
import { InitializeSessionArgs } from './types';
import type { InboxService } from '../api';

const NOVU_APP_ID_KEY = 'novu_sandbox_application_identifier';

export class Session {
  #emitter: NovuEventEmitter;
  #inboxService: InboxService;
  #options: InitializeSessionArgs;

  constructor(
    options: InitializeSessionArgs,
    inboxServiceInstance: InboxService,
    eventEmitterInstance: NovuEventEmitter
  ) {
    this.#emitter = eventEmitterInstance;
    this.#inboxService = inboxServiceInstance;
    this.#options = options;
  }

  public get applicationIdentifier() {
    return this.#options.applicationIdentifier;
  }

  public get subscriberId() {
    return this.#options.subscriberId;
  }

  private getStoredApplicationIdentifier(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(NOVU_APP_ID_KEY);
    }

    return null;
  }

  private storeApplicationIdentifier(identifier: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(NOVU_APP_ID_KEY, identifier);
    }
  }

  public async initialize(): Promise<void> {
    try {
      const { subscriberId, subscriberHash, applicationIdentifier } = this.#options;

      // eslint-disable-next-line no-console
      console.log('applicationIdentifier 33 ', applicationIdentifier);

      let finalApplicationIdentifier = applicationIdentifier;
      if (!finalApplicationIdentifier) {
        // Check if we have a stored application identifier
        const storedAppId = this.getStoredApplicationIdentifier();
        if (storedAppId) {
          finalApplicationIdentifier = storedAppId;
        }
      }

      // eslint-disable-next-line no-console
      console.log('finalApplicationIdentifier 33 ', finalApplicationIdentifier);

      this.#emitter.emit('session.initialize.pending', { args: this.#options });
      const response = await this.#inboxService.initializeSession({
        applicationIdentifier: finalApplicationIdentifier,
        subscriberId,
        subscriberHash,
      });

      // Check if the response's applicationIdentifier starts with pk_sandbox_
      if (response?.applicationIdentifier?.startsWith('pk_sandbox_')) {
        this.storeApplicationIdentifier(response.applicationIdentifier);
      }

      this.#emitter.emit('session.initialize.resolved', { args: this.#options, data: response });
    } catch (error) {
      this.#emitter.emit('session.initialize.resolved', { args: this.#options, error });
    }
  }
}
