import { InboxService } from '../api';
import { BaseModule } from '../base-module';
import { NovuEventEmitter } from '../event-emitter';
import type { Result } from '../types';
import { deleteChannelConnection, generateChatOAuthUrl, getChannelConnection, listChannelConnections } from './helpers';
import type {
  ChannelConnectionResponse,
  DeleteChannelConnectionArgs,
  GenerateChatOAuthUrlArgs,
  GetChannelConnectionArgs,
  ListChannelConnectionsArgs,
} from './types';

export type ConnectAndLinkArgs = Omit<GenerateChatOAuthUrlArgs, 'endpointType' | 'endpointData'> & {
  /** The type of channel endpoint to auto-create when the OAuth flow completes. */
  endpointType: string;
  /** The endpoint payload matching the chosen `endpointType`. */
  endpointData: Record<string, string>;
};

export class ChannelConnections extends BaseModule {
  constructor({
    inboxServiceInstance,
    eventEmitterInstance,
  }: {
    inboxServiceInstance: InboxService;
    eventEmitterInstance: NovuEventEmitter;
  }) {
    super({ inboxServiceInstance, eventEmitterInstance });
  }

  async generateOAuthUrl(args: GenerateChatOAuthUrlArgs): Result<{ url: string }> {
    return this.callWithSession(() =>
      generateChatOAuthUrl({
        emitter: this._emitter,
        apiService: this._inboxService,
        args,
      })
    );
  }

  async list(args: ListChannelConnectionsArgs = {}): Result<ChannelConnectionResponse[]> {
    return this.callWithSession(() =>
      listChannelConnections({
        emitter: this._emitter,
        apiService: this._inboxService,
        args,
      })
    );
  }

  async get(args: GetChannelConnectionArgs): Result<ChannelConnectionResponse | null> {
    return this.callWithSession(() =>
      getChannelConnection({
        emitter: this._emitter,
        apiService: this._inboxService,
        args,
      })
    );
  }

  async delete(args: DeleteChannelConnectionArgs): Result<void> {
    return this.callWithSession(() =>
      deleteChannelConnection({
        emitter: this._emitter,
        apiService: this._inboxService,
        args,
      })
    );
  }

  /**
   * Generates a chat OAuth URL that, once the user completes the OAuth flow, will automatically
   * create both the channel connection and the channel endpoint in a single round-trip.
   *
   * This eliminates the need to separately call `channelEndpoints.create()` after connecting.
   */
  async connectAndLink(args: ConnectAndLinkArgs): Result<{ url: string }> {
    return this.callWithSession(() =>
      generateChatOAuthUrl({
        emitter: this._emitter,
        apiService: this._inboxService,
        args,
      })
    );
  }
}
