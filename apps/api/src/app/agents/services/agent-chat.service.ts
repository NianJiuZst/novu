import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from '@novu/application-generic';
import { AgentEntity, AgentRepository, IntegrationRepository } from '@novu/dal';
import { ChatProviderIdEnum, ConversationMessageRoleEnum } from '@novu/shared';
import type { Request } from 'express';
import { CreateConversationCommand } from '../../conversations/usecases/create-conversation/create-conversation.command';
import { CreateConversation } from '../../conversations/usecases/create-conversation/create-conversation.usecase';
import { CreateConversationMessageCommand } from '../../conversations/usecases/create-conversation-message/create-conversation-message.command';
import { CreateConversationMessage } from '../../conversations/usecases/create-conversation-message/create-conversation-message.usecase';
import { expressToFetchRequest } from '../utils/express-to-fetch';
import { AgentSubscriberResolverService } from './agent-subscriber-resolver.service';

const PONG_RESPONSE = 'PONG';

type MessageAuthor = {
  userId: string;
  userName: string;
  fullName: string;
  isBot: boolean | 'unknown';
};

type InboundMessage = {
  text: string;
  author: MessageAuthor;
};

type Conversation = {
  id: string;
  state: Record<string, unknown>;
  participants: string[];
  status: 'active' | 'idle' | 'resolved';
};

type StoredConversation = Conversation & {
  createdAt: Date;
  lastMessageAt: Date;
};

function readSlackMessageTs(message: unknown): string | undefined {
  if (!message || typeof message !== 'object') {
    return undefined;
  }

  const record = message as Record<string, unknown>;
  const ts = record.ts;

  return typeof ts === 'string' && ts.length > 0 ? ts : undefined;
}

function resolveNovuConversationId(
  conversation: Conversation,
  ensureReturnedId: string | undefined
): string | undefined {
  const fromState = conversation.state.novuConversationId as string | undefined;

  return ensureReturnedId ?? fromState;
}

@Injectable()
export class AgentChatService {
  private readonly chatInstances = new Map<string, unknown>();

  private readonly conversationStore = new Map<string, StoredConversation>();

  private readonly slackUserLinkCache = new Set<string>();

  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly integrationRepository: IntegrationRepository,
    private readonly subscriberResolver: AgentSubscriberResolverService,
    private readonly createConversation: CreateConversation,
    private readonly createConversationMessage: CreateConversationMessage,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(AgentChatService.name);
  }

  async handleWebhook(agentId: string, platform: string, expressReq: Request): Promise<globalThis.Response> {
    const agent = await this.agentRepository.findOne({ _id: agentId } as never, '*');

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const chat = await this.getOrCreateChat(agent);
    const fetchReq = expressToFetchRequest(expressReq);

    type WebhookHandler = (
      request: globalThis.Request,
      ctx: { waitUntil: (task: Promise<unknown>) => void }
    ) => Promise<globalThis.Response>;

    const webhooks = chat as { webhooks: Record<string, WebhookHandler> };
    const handler = webhooks.webhooks[platform];

    if (!handler) {
      return new globalThis.Response(`Unknown platform: ${platform}`, { status: 404 });
    }

    return handler(fetchReq, {
      waitUntil: (task: Promise<unknown>) => {
        void task.catch((err) => {
          this.logger.error({ err }, '[agent-webhook] waitUntil task failed');
        });
      },
    });
  }

  private async getSlackIntegrationIdentifier(agent: AgentEntity): Promise<string | undefined> {
    const ids = agent.integrationIds;

    if (!ids?.length) {
      return undefined;
    }

    for (const integrationId of ids) {
      const integration = await this.integrationRepository.findOne(
        {
          _environmentId: agent._environmentId,
          _organizationId: agent._organizationId,
          _id: integrationId,
        },
        ['identifier', 'providerId']
      );

      if (integration && integration.providerId === ChatProviderIdEnum.Slack) {
        return integration.identifier;
      }
    }

    const first = await this.integrationRepository.findOne(
      {
        _environmentId: agent._environmentId,
        _organizationId: agent._organizationId,
        _id: ids[0],
      },
      ['identifier']
    );

    return first?.identifier;
  }

  private async getOrCreateChat(agent: AgentEntity): Promise<{ webhooks: Record<string, unknown> }> {
    const cached = this.chatInstances.get(agent._id);

    if (cached) {
      return cached as { webhooks: Record<string, unknown> };
    }

    const [{ Chat }, { createSlackAdapter }, { createRedisState }] = await Promise.all([
      import('chat'),
      import('@chat-adapter/slack'),
      import('@chat-adapter/state-redis'),
    ]);

    const integrationIdentifier = await this.getSlackIntegrationIdentifier(agent);
    const environmentId = String(agent._environmentId);
    const organizationId = String(agent._organizationId);

    const chatInstance = new Chat({
      userName: agent.identifier,
      adapters: {
        slack: createSlackAdapter(),
      },
      state: createRedisState(),
      onLockConflict: 'force',
    });

    const getOrCreateConversation = (threadId: string, participantId: string): Conversation => {
      const existing = this.conversationStore.get(threadId);

      if (existing) {
        return existing;
      }

      const conversation: StoredConversation = {
        id: threadId,
        state: {},
        participants: [participantId],
        status: 'active',
        createdAt: new Date(),
        lastMessageAt: new Date(),
      };

      this.conversationStore.set(threadId, conversation);

      return conversation;
    };

    const saveConversation = (conversation: Conversation) => {
      const stored = this.conversationStore.get(conversation.id);

      if (stored) {
        Object.assign(stored, conversation);
        stored.lastMessageAt = new Date();
      } else {
        this.conversationStore.set(conversation.id, {
          ...conversation,
          createdAt: new Date(),
          lastMessageAt: new Date(),
        });
      }
    };

    const ensureNovuConversationRecord = async (
      conversation: Conversation,
      subscriberId: string,
      threadId: string,
      platformKey: string
    ): Promise<string | undefined> => {
      const existing = conversation.state.novuConversationId as string | undefined;

      if (existing) {
        return existing;
      }

      try {
        const created = await this.createConversation.execute(
          CreateConversationCommand.create({
            environmentId,
            organizationId,
            subscriberId,
            agentId: agent._id,
            platform: platformKey,
            platformThreadId: threadId,
          })
        );

        const id = created.identifier;
        conversation.state.novuConversationId = id;
        saveConversation(conversation);

        return id;
      } catch (err) {
        this.logger.error({ err }, '[agent-webhook] createConversation failed');

        return undefined;
      }
    };

    const persistNovuConversationMessages = async (
      conversationIdentifier: string | undefined,
      entries: Array<{
        role: ConversationMessageRoleEnum;
        content: string;
        senderName?: string;
        platformMessageId?: string;
      }>,
      platformKey: string,
      expectedSubscriberId: string
    ): Promise<void> => {
      if (!conversationIdentifier) {
        this.logger.warn('[agent-webhook] skip message persist: missing conversation id');

        return;
      }

      for (const entry of entries) {
        if (!entry.content.trim()) {
          continue;
        }

        try {
          await this.createConversationMessage.execute(
            CreateConversationMessageCommand.create({
              environmentId,
              organizationId,
              conversationIdentifier,
              role: entry.role,
              content: entry.content,
              senderName: entry.senderName,
              platform: platformKey,
              platformMessageId: entry.platformMessageId,
              expectedSubscriberId,
            })
          );
        } catch (err) {
          this.logger.error({ err }, '[agent-webhook] createConversationMessage failed');
        }
      }
    };

    const resolveSubscriberForSlackMessage = async (author: MessageAuthor): Promise<string> => {
      const platformUserId = author.userId;
      let resolvedId = platformUserId;

      if (integrationIdentifier) {
        resolvedId = await this.subscriberResolver.resolveSlackSubscriberId({
          organizationId,
          environmentId,
          slackUserId: platformUserId,
          integrationIdentifier,
          singleSlackConnectionFallback: true,
        });
      }

      if (integrationIdentifier) {
        const linkKey = `${resolvedId}::${platformUserId}`;

        if (!this.slackUserLinkCache.has(linkKey)) {
          await this.subscriberResolver.ensureSlackUserLinked({
            organizationId,
            environmentId,
            subscriberId: resolvedId,
            slackUserId: platformUserId,
            slackUserName: author.userName,
            integrationIdentifier,
          });
          this.slackUserLinkCache.add(linkKey);
        }
      }

      return resolvedId;
    };

    const buildHistory = async (thread: {
      allMessages: AsyncIterable<{ text: string; author: { isMe: boolean }; metadata?: { dateSent?: Date } }>;
    }) => {
      const messages: Array<{ text: string; isBot: boolean; timestamp: string }> = [];

      for await (const msg of thread.allMessages) {
        messages.push({
          text: msg.text,
          isBot: msg.author.isMe,
          timestamp: msg.metadata?.dateSent?.toISOString() ?? new Date().toISOString(),
        });
      }

      return messages;
    };

    const handleInbound = async (
      thread: {
        id: string;
        subscribe: () => Promise<void>;
        post: (text: string) => Promise<unknown>;
        startTyping: () => Promise<void>;
        allMessages: AsyncIterable<{ text: string; author: { isMe: boolean }; metadata?: { dateSent?: Date } }>;
      },
      message: InboundMessage,
      options: { subscribeFirst: boolean; useTyping: boolean }
    ) => {
      const platformKey = 'slack';

      if (options.subscribeFirst) {
        await thread.subscribe();
      }

      const conversation = getOrCreateConversation(thread.id, message.author.userId);

      if (!conversation.participants.includes(message.author.userId)) {
        conversation.participants.push(message.author.userId);
      }

      const resolvedSubscriberId = await resolveSubscriberForSlackMessage(message.author);

      const ensuredId = await ensureNovuConversationRecord(conversation, resolvedSubscriberId, thread.id, platformKey);
      const novuConversationId = resolveNovuConversationId(conversation, ensuredId);

      await persistNovuConversationMessages(
        novuConversationId,
        [
          {
            role: ConversationMessageRoleEnum.USER,
            content: message.text,
            senderName: message.author.fullName,
            platformMessageId: readSlackMessageTs(message as unknown),
          },
        ],
        platformKey,
        resolvedSubscriberId
      );

      if (options.useTyping) {
        await buildHistory(thread);
        await thread.startTyping();
      }

      await persistNovuConversationMessages(
        novuConversationId,
        [
          {
            role: ConversationMessageRoleEnum.ASSISTANT,
            content: PONG_RESPONSE,
            senderName: agent.identifier,
          },
        ],
        platformKey,
        resolvedSubscriberId
      );

      await thread.post(PONG_RESPONSE);

      saveConversation(conversation);
    };

    chatInstance.onNewMention(async (thread, message) => {
      this.logger.info(`[${agent.identifier}] New mention from ${message.author.fullName} in ${thread.id}`);

      await handleInbound(thread, message, { subscribeFirst: true, useTyping: false });
    });

    chatInstance.onSubscribedMessage(async (thread, message) => {
      this.logger.info(`[${agent.identifier}] Message from ${message.author.fullName}`);

      await handleInbound(thread, message, { subscribeFirst: false, useTyping: true });
    });

    this.chatInstances.set(agent._id, chatInstance);

    return chatInstance as unknown as { webhooks: Record<string, unknown> };
  }
}
