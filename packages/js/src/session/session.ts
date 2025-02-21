import { NovuEventEmitter } from '../event-emitter';
import { InitializeSessionArgs } from './types';
import type { InboxService } from '../api';

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

  private handleJwtString(jwt: string) {
    const response = {
      token: jwt,
      // TODO: SEPARATE THIS FROM THE SESSION INITIALIZATION
      totalUnreadCount: 0,
      removeNovuBranding: false,
    };
    this.#emitter.emit('session.initialize.resolved', { args: this.#options, data: response });
  }

  private async handleSessionObject({
    applicationIdentifier,
    subscriberId,
    subscriberHash,
  }: {
    subscriberId: string;
    applicationIdentifier: string;
    subscriberHash?: string;
  }) {
    if (applicationIdentifier.startsWith('pk_live')) {
      throw new Error('Using live application ID is not allowed');
    }
    const response = await this.#inboxService.initializeSession({
      applicationIdentifier,
      subscriberId,
      subscriberHash,
    });
    this.#emitter.emit('session.initialize.resolved', { args: this.#options, data: response });
  }

  public async initialize(): Promise<void> {
    try {
      const { applicationIdentifier, subscriberId, subscriberHash, jwt } = this.#options;
      this.#emitter.emit('session.initialize.pending', { args: this.#options });

      if (!jwt) {
        await this.handleSessionObject({
          applicationIdentifier,
          subscriberId,
          subscriberHash,
        });

        return;
      }

      if (typeof jwt === 'string') {
        this.handleJwtString(jwt);
      } else if (typeof jwt === 'object') {
        await this.handleSessionObject(jwt);
      } else if (typeof jwt === 'function') {
        setInterval(async () => {
          const result = await jwt();
          if (typeof result === 'string') {
            this.handleJwtString(result);
          } else {
            await this.handleSessionObject(result);
          }
        }, 30_000);
      }
    } catch (error) {
      this.#emitter.emit('session.initialize.resolved', { args: this.#options, error });
    }
  }
}
