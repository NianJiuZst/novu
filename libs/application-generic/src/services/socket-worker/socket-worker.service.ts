import { Injectable, Logger } from '@nestjs/common';
import got, { HTTPError, RequestError } from 'got';
import { ChannelTypeEnum, FeatureFlagsKeysEnum, WebSocketEventEnum } from '@novu/shared';
import { MessageRepository } from '@novu/dal';

import { FeatureFlagsService } from '../feature-flags';

const LOG_CONTEXT = 'SocketWorkerService';

type UnseenCountPaginationIndication = {
  unseenCount: number;
  hasMore: boolean;
};

type UnreadCountPaginationIndication = {
  unreadCount: number;
  hasMore: boolean;
};

@Injectable()
export class SocketWorkerService {
  private readonly socketWorkerUrl: string | undefined;
  private readonly socketWorkerApiKey: string | undefined;

  constructor(
    private featureFlagsService: FeatureFlagsService,
    private messageRepository: MessageRepository
  ) {
    this.socketWorkerUrl = process.env.SOCKET_WORKER_URL;
    this.socketWorkerApiKey = process.env.INTERNAL_SERVICES_API_KEY;
  }

  async sendMessage(
    userId: string,
    event: string,
    data: any,
    organizationId?: string,
    environmentId?: string,
    subscriberId?: string
  ): Promise<void> {
    if (event === WebSocketEventEnum.RECEIVED) {
      const { messageId } = data || {};
      const storedMessage = await this.messageRepository.findOne({
        _id: messageId,
        _environmentId: environmentId,
      });

      if (!storedMessage) {
        Logger.error(`Message with id ${messageId} not found in environment ${environmentId}`, LOG_CONTEXT);

        return;
      }

      // Only recalculate the counts if we send a messageId/message.
      if (messageId) {
        // Prepare bulk messages: main message + unseen count + unread count
        const messages = [
          {
            userId,
            event,
            data: { message: storedMessage },
          },
        ];

        // Get unseen count data
        const unseenData = await this.getUnseenCountData(userId, environmentId);
        if (unseenData) {
          messages.push({
            userId,
            event: WebSocketEventEnum.UNSEEN,
            data: unseenData,
          });
        }

        // Get unread count data
        const unreadData = await this.getUnreadCountData(userId, environmentId);
        if (unreadData) {
          messages.push({
            userId,
            event: WebSocketEventEnum.UNREAD,
            data: unreadData,
          });
        }

        // Send all messages in bulk
        await this.sendBulkMessages(messages, environmentId);
      } else {
        // No messageId, just send the main message
        await this.sendMessageInternal(
          userId,
          event,
          { message: storedMessage },
          organizationId,
          environmentId,
          subscriberId
        );
      }
    } else if (event === WebSocketEventEnum.UNREAD) {
      await this.sendUnreadCount(userId, environmentId, organizationId);
    } else if (event === WebSocketEventEnum.UNSEEN) {
      await this.sendUnseenCount(userId, environmentId, organizationId);
    } else {
      await this.sendMessageInternal(userId, event, data, organizationId, environmentId, subscriberId);
    }
  }

  private async sendBulkMessages(
    messages: Array<{ userId: string; event: string; data: any }>,
    environmentId?: string
  ): Promise<void> {
    if (!this.socketWorkerUrl) {
      Logger.debug('Socket worker URL not configured, skipping bulk dispatch', LOG_CONTEXT);

      return;
    }

    if (!this.socketWorkerApiKey) {
      Logger.error('Socket worker API key not configured, cannot dispatch bulk messages', LOG_CONTEXT);

      return;
    }

    try {
      const payload = {
        messages,
        environmentId,
      };

      Logger.log(`Dispatching ${messages.length} bulk messages to socket worker`, LOG_CONTEXT);

      const response = await got.post(`${this.socketWorkerUrl}/send/bulk`, {
        json: payload,
        headers: {
          Authorization: `Bearer ${this.socketWorkerApiKey}`,
        },
        responseType: 'json',
        timeout: 10000, // 10 second timeout for bulk requests
        retry: {
          limit: 2,
          methods: ['POST'],
          statusCodes: [408, 429, 500, 502, 503, 504],
        },
      });

      const result = response.body as any;
      Logger.debug(
        `Successfully dispatched bulk messages: ${result.processed}/${result.total} processed`,
        LOG_CONTEXT
      );

      if (result.failed > 0) {
        Logger.warn(`${result.failed} messages failed in bulk dispatch`, LOG_CONTEXT);
      }
    } catch (error) {
      if (error instanceof HTTPError) {
        const { statusCode } = error.response;
        const errorText = error.response.body || error.message;

        if (statusCode === 401) {
          Logger.error(
            `Unauthorized request to socket worker - check API key configuration: ${errorText}`,
            LOG_CONTEXT
          );
        } else {
          Logger.error(`Failed to dispatch bulk messages to socket worker: ${statusCode} - ${errorText}`, LOG_CONTEXT);
        }
      } else if (error instanceof RequestError) {
        Logger.error(`Request error dispatching bulk messages to socket worker: ${error.message}`, LOG_CONTEXT);
      } else {
        Logger.error(
          `Error dispatching bulk messages to socket worker: ${error instanceof Error ? error.message : String(error)}`,
          LOG_CONTEXT
        );
      }
    }
  }

  private async sendMessageInternal(
    userId: string,
    event: string,
    data: any,
    organizationId?: string,
    environmentId?: string,
    subscriberId?: string
  ): Promise<void> {
    if (!this.socketWorkerUrl) {
      Logger.debug('Socket worker URL not configured, skipping dispatch', LOG_CONTEXT);

      return;
    }

    if (!this.socketWorkerApiKey) {
      Logger.error('Socket worker API key not configured, cannot dispatch', LOG_CONTEXT);

      return;
    }

    try {
      const payload = {
        userId,
        event,
        data,
        organizationId,
        environmentId,
        subscriberId,
      };

      Logger.log(`Dispatching event ${event} to socket worker for user ${userId}`, LOG_CONTEXT);

      await got.post(`${this.socketWorkerUrl}/send`, {
        json: payload,
        headers: {
          Authorization: `Bearer ${this.socketWorkerApiKey}`,
        },
        responseType: 'json',
        timeout: 5000, // 5 second timeout
        retry: {
          limit: 2,
          methods: ['POST'],
          statusCodes: [408, 429, 500, 502, 503, 504],
        },
      });

      Logger.debug(`Successfully dispatched event ${event} to socket worker for user ${userId}`, LOG_CONTEXT);
    } catch (error) {
      if (error instanceof HTTPError) {
        const { statusCode } = error.response;
        const errorText = error.response.body || error.message;

        if (statusCode === 401) {
          Logger.error(
            `Unauthorized request to socket worker - check API key configuration: ${errorText}`,
            LOG_CONTEXT
          );
        } else {
          Logger.error(`Failed to dispatch to socket worker: ${statusCode} - ${errorText}`, LOG_CONTEXT);
        }
      } else if (error instanceof RequestError) {
        Logger.error(`Request error dispatching to socket worker: ${error.message}`, LOG_CONTEXT);
      } else {
        Logger.error(
          `Error dispatching to socket worker: ${error instanceof Error ? error.message : String(error)}`,
          LOG_CONTEXT
        );
      }
    }
  }

  private async getUnreadCountData(userId: string, environmentId: string): Promise<any | null> {
    try {
      const unreadCount = await this.messageRepository.getCount(
        environmentId,
        userId,
        ChannelTypeEnum.IN_APP,
        { read: false },
        { limit: 101 },
        undefined,
        'primary'
      );

      const paginationIndication: UnreadCountPaginationIndication =
        unreadCount > 100 ? { unreadCount: 100, hasMore: true } : { unreadCount, hasMore: false };

      return {
        unreadCount: paginationIndication.unreadCount,
        hasMore: paginationIndication.hasMore,
      };
    } catch (error) {
      Logger.error(
        `Error getting unread count data: ${error instanceof Error ? error.message : String(error)}`,
        LOG_CONTEXT
      );

      return null;
    }
  }

  private async getUnseenCountData(userId: string, environmentId: string): Promise<any | null> {
    try {
      const unseenCount = await this.messageRepository.getCount(
        environmentId,
        userId,
        ChannelTypeEnum.IN_APP,
        { seen: false },
        { limit: 101 },
        undefined,
        'primary'
      );

      const paginationIndication: UnseenCountPaginationIndication =
        unseenCount > 100 ? { unseenCount: 100, hasMore: true } : { unseenCount, hasMore: false };

      return {
        unseenCount: paginationIndication.unseenCount,
        hasMore: paginationIndication.hasMore,
      };
    } catch (error) {
      Logger.error(
        `Error getting unseen count data: ${error instanceof Error ? error.message : String(error)}`,
        LOG_CONTEXT
      );

      return null;
    }
  }

  private async sendUnreadCountChange(userId: string, environmentId: string, organizationId?: string): Promise<void> {
    try {
      const data = await this.getUnreadCountData(userId, environmentId);
      if (data) {
        await this.sendMessageInternal(userId, WebSocketEventEnum.UNREAD, data, organizationId, environmentId);
      }
    } catch (error) {
      Logger.error(
        `Error sending unread count change: ${error instanceof Error ? error.message : String(error)}`,
        LOG_CONTEXT
      );
    }
  }

  private async sendUnseenCountChange(userId: string, environmentId: string, organizationId?: string): Promise<void> {
    try {
      const data = await this.getUnseenCountData(userId, environmentId);
      if (data) {
        await this.sendMessageInternal(userId, WebSocketEventEnum.UNSEEN, data, organizationId, environmentId);
      }
    } catch (error) {
      Logger.error(
        `Error sending unseen count change: ${error instanceof Error ? error.message : String(error)}`,
        LOG_CONTEXT
      );
    }
  }

  async sendUnseenCount(userId: string, environmentId: string, organizationId?: string): Promise<void> {
    return this.sendUnseenCountChange(userId, environmentId, organizationId);
  }

  async sendUnreadCount(userId: string, environmentId: string, organizationId?: string): Promise<void> {
    return this.sendUnreadCountChange(userId, environmentId, organizationId);
  }

  async isEnabled(environmentId?: string): Promise<boolean> {
    const hasConfig = !!this.socketWorkerUrl && !!this.socketWorkerApiKey;

    if (!hasConfig) {
      return false;
    }

    if (process.env.NOVU_ENTERPRISE !== 'true') {
      return false;
    }

    const isFeatureFlagEnabled = await this.featureFlagsService.getFlag({
      key: FeatureFlagsKeysEnum.IS_CLOUDFLARE_SOCKETS_ENABLED,
      environment: { _id: environmentId },
      defaultValue: false,
    });

    return isFeatureFlagEnabled;
  }
}
