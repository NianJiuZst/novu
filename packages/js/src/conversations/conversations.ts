import { InboxService } from '../api';
import { BaseModule } from '../base-module';
import { NovuEventEmitter } from '../event-emitter';
import type { Result } from '../types';
import { NovuError } from '../utils/errors';
import type {
  ListConversationMessagesArgs,
  ListConversationMessagesResult,
  ListConversationsArgs,
  ListConversationsResult,
} from './types';

export class Conversations extends BaseModule {
  constructor({
    inboxServiceInstance,
    eventEmitterInstance,
  }: {
    inboxServiceInstance: InboxService;
    eventEmitterInstance: NovuEventEmitter;
  }) {
    super({ inboxServiceInstance, eventEmitterInstance });
  }

  async list(args: ListConversationsArgs = {}): Result<ListConversationsResult> {
    return this.callWithSession(async () => {
      try {
        const { limit = 10, ...rest } = args;

        this._emitter.emit('conversations.list.pending', { args });

        const data = await this._inboxService.fetchConversations({ limit, ...rest });

        this._emitter.emit('conversations.list.resolved', { args, data });

        return { data };
      } catch (error) {
        this._emitter.emit('conversations.list.resolved', { args, error });

        return { error: new NovuError('Failed to fetch conversations', error) };
      }
    });
  }

  async messages(
    conversationId: string,
    args: ListConversationMessagesArgs = {}
  ): Result<ListConversationMessagesResult> {
    return this.callWithSession(async () => {
      const fullArgs = { conversationId, ...args };

      try {
        const { limit = 50, ...rest } = args;

        this._emitter.emit('conversations.messages.pending', { args: fullArgs });

        const data = await this._inboxService.fetchConversationMessages(conversationId, { limit, ...rest });

        this._emitter.emit('conversations.messages.resolved', { args: fullArgs, data });

        return { data };
      } catch (error) {
        this._emitter.emit('conversations.messages.resolved', { args: fullArgs, error });

        return { error: new NovuError('Failed to fetch conversation messages', error) };
      }
    });
  }
}
