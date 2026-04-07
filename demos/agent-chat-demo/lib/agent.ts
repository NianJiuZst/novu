import { createGitHubAdapter } from '@chat-adapter/github';
import { createSlackAdapter } from '@chat-adapter/slack';
import { createRedisState } from '@chat-adapter/state-redis';
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp';
import type { Novu } from '@novu/api';
import { createResendAdapter } from '@resend/chat-sdk-adapter';
import { Chat, type Thread, emoji } from 'chat';
import { after } from 'next/server';

import {
  appendNovuConversationMessage,
  createNovuApiClient,
  createOrGetNovuConversation,
  getNovuServerUrl,
  updateNovuConversationStatus,
} from './novu-server-api';
import { createSlackSubscriberResolver, ensureSlackUserLinked } from './slack-subscriber-resolution';

type ChatAdapters = NonNullable<ConstructorParameters<typeof Chat>[0]['adapters']>;

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Signal =
  | { type: 'state.set'; delta: Record<string, unknown> }
  | { type: 'state.increment'; key: string; by: number }
  | { type: 'state.append'; key: string; value: unknown }
  | { type: 'state.delete'; key: string }
  | { type: 'trigger'; workflowId: string; to?: { subscriberId: string }; payload?: Record<string, any> }
  | { type: 'escalate'; channel: string; to?: string; reason?: string; summary?: string }
  | { type: 'resolve'; summary?: string }
  | { type: 'typing' };

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

type HistoryEntry = {
  text: string;
  isBot: boolean;
  timestamp: string;
};

export type Conversation = {
  id: string;
  state: Record<string, unknown>;
  participants: string[];
  status: 'active' | 'idle' | 'resolved';
};

type Subscriber = {
  subscriberId: string;
  name?: string;
};

export type AgentMessageContext = {
  message: InboundMessage;
  conversation: Conversation;
  subscriber: Subscriber;
  history: HistoryEntry[];
  novu: NovuContext;
};

export type AgentLifecycleContext = {
  conversation: Conversation;
  subscriber: Subscriber;
  message?: InboundMessage;
  novu: NovuContext;
};

type RichResponse = {
  text: string;
  cards?: unknown[];
  actions?: unknown[];
};

type AgentConfig = {
  platforms?: string[];
  idleTimeoutMs?: number;
  resolveAfterIdleMs?: number;
  throttle?: { max: number; windowMs: number };
};

type AgentHandlers = {
  onMessage: (ctx: AgentMessageContext) => Promise<string | RichResponse>;
  onSubscribe?: (ctx: AgentLifecycleContext) => Promise<string | void>;
  onIdle?: (ctx: AgentLifecycleContext) => Promise<string | void>;
  onResolve?: (ctx: AgentLifecycleContext) => Promise<void>;
  config?: AgentConfig;
};

export type AgentHandleResult = {
  response: string | RichResponse | void;
  signals: Signal[];
};

// ---------------------------------------------------------------------------
// NovuContext — the collector
// ---------------------------------------------------------------------------

export class NovuContext {
  private collected: Signal[] = [];

  state = {
    set: (delta: Record<string, unknown>) => {
      this.collected.push({ type: 'state.set', delta });
    },
    increment: (key: string, by = 1) => {
      this.collected.push({ type: 'state.increment', key, by });
    },
    append: (key: string, value: unknown) => {
      this.collected.push({ type: 'state.append', key, value });
    },
    delete: (key: string) => {
      this.collected.push({ type: 'state.delete', key });
    },
  };

  trigger(workflowId: string, options: { to?: { subscriberId: string }; payload?: Record<string, any> }) {
    this.collected.push({ type: 'trigger', workflowId, ...options });
  }

  escalate(channel: string, options?: { to?: string; reason?: string; summary?: string }) {
    this.collected.push({ type: 'escalate', channel, ...options });
  }

  resolve(summary?: string) {
    this.collected.push({ type: 'resolve', summary });
  }

  startTyping() {
    this.collected.push({ type: 'typing' });
  }

  _collect(): Signal[] {
    return this.collected;
  }
}

// ---------------------------------------------------------------------------
// Signal executor — runs collected signals against Novu + conversation store
// ---------------------------------------------------------------------------

export async function executeSignals(
  signals: Signal[],
  conversation: Conversation,
  saveConversation: (c: Conversation) => void,
  novuClient: Novu
) {
  for (const signal of signals) {
    switch (signal.type) {
      case 'state.set':
        Object.assign(conversation.state, signal.delta);
        break;
      case 'state.increment': {
        const current = (conversation.state[signal.key] as number) ?? 0;
        conversation.state[signal.key] = current + signal.by;
        break;
      }
      case 'state.append': {
        const arr = (conversation.state[signal.key] as unknown[]) ?? [];
        arr.push(signal.value);
        conversation.state[signal.key] = arr;
        break;
      }
      case 'state.delete':
        delete conversation.state[signal.key];
        break;
      case 'trigger':
        try {
          await novuClient.trigger({
            workflowId: signal.workflowId,
            to: signal.to ?? { subscriberId: 'default' },
            payload: signal.payload ?? {},
          });
          console.log(`[novu] triggered workflow: ${signal.workflowId}`);
        } catch (err) {
          console.error(`[novu] failed to trigger ${signal.workflowId}:`, err);
        }
        break;
      case 'escalate':
        console.log(`[novu] escalation requested: channel=${signal.channel} to=${signal.to}`);
        break;
      case 'resolve':
        conversation.status = 'resolved';
        console.log(`[novu] conversation resolved: ${signal.summary ?? ''}`);
        break;
      case 'typing':
        break;
    }
  }

  saveConversation(conversation);
}

// ---------------------------------------------------------------------------
// agent() — the first-class primitive
// ---------------------------------------------------------------------------

export type AgentInstance = ReturnType<typeof agent>;

export function agent(id: string, handlers: AgentHandlers) {
  return {
    id,
    config: handlers.config ?? {},

    async handleMessage(input: Omit<AgentMessageContext, 'novu'>): Promise<AgentHandleResult> {
      const novu = new NovuContext();
      const response = await handlers.onMessage({ ...input, novu });

      return { response, signals: novu._collect() };
    },

    async handleSubscribe(input: Omit<AgentLifecycleContext, 'novu'>): Promise<AgentHandleResult> {
      const novu = new NovuContext();
      const response = handlers.onSubscribe ? await handlers.onSubscribe({ ...input, novu }) : undefined;

      return { response, signals: novu._collect() };
    },

    async handleResolve(input: Omit<AgentLifecycleContext, 'novu'>): Promise<AgentHandleResult> {
      const novu = new NovuContext();
      if (handlers.onResolve) {
        await handlers.onResolve({ ...input, novu });
      }

      return { response: undefined, signals: novu._collect() };
    },
  };
}

// ---------------------------------------------------------------------------
// serveAgents() — Next.js webhook wiring (Chat SDK, store, signals)
// ---------------------------------------------------------------------------

type StoredConversation = Conversation & {
  createdAt: Date;
  lastMessageAt: Date;
};

export type ServeAgentsOptions = {
  agents: AgentInstance[];
  userName?: string;
  adapters?: ChatAdapters;
  novuSecretKey?: string;
  stateAdapter?: ReturnType<typeof createRedisState>;
  onLockConflict?: ConstructorParameters<typeof Chat>[0]['onLockConflict'];
  /**
   * Optional override (e.g. load from your DB). Return undefined to continue with built-in Slack resolution.
   */
  resolveSubscriberId?: (platformUserId: string, platform: string) => Promise<string | undefined>;
  /** When set, Slack user ids are mapped via `slack_user` channel endpoints and/or the single-connection demo fallback. */
  slackIntegrationIdentifier?: string;
  /** When true (default), if there is exactly one Slack connection in the env, use its subscriberId for all Slack users. */
  singleSlackConnectionFallback?: boolean;
};

function detectPlatform(threadId: string): string {
  if (threadId.startsWith('whatsapp:')) {
    return 'whatsapp';
  }
  if (threadId.startsWith('github:')) {
    return 'github';
  }
  if (threadId.startsWith('resend:')) {
    return 'resend';
  }

  return 'slack';
}

function buildDefaultAdapters(platforms?: string[]): ChatAdapters {
  const map = {} as ChatAdapters;
  const list = platforms?.length ? platforms : ['slack'];

  for (const platform of list) {
    if (platform === 'slack') {
      map.slack = createSlackAdapter();
    }
    if (platform === 'whatsapp') {
      map.whatsapp = createWhatsAppAdapter();
    }
    if (platform === 'github') {
      map.github = createGitHubAdapter({
        botUserId: process.env.GITHUB_BOT_USER_ID ? Number(process.env.GITHUB_BOT_USER_ID) : undefined,
      });
    }
    if (platform === 'resend') {
      map.resend = createResendAdapter({
        fromAddress: process.env.RESEND_FROM_ADDRESS ?? '',
        fromName: process.env.RESEND_FROM_NAME,
      });
    }
  }

  return map;
}

export function serveAgents(options: ServeAgentsOptions) {
  const { agents } = options;

  if (!agents.length) {
    throw new Error('serveAgents requires at least one agent');
  }

  const primaryAgent = agents[0];
  const store = new Map<string, StoredConversation>();
  const slackUserLinkCache = new Set<string>();

  const slackUserResolver = options.slackIntegrationIdentifier
    ? createSlackSubscriberResolver({
        integrationIdentifier: options.slackIntegrationIdentifier,
        singleSlackConnectionFallback: options.singleSlackConnectionFallback ?? true,
      })
    : null;

  function getOrCreateConversation(threadId: string, participantId: string): Conversation {
    const existing = store.get(threadId);

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

    store.set(threadId, conversation);

    return conversation;
  }

  function saveConversation(conversation: Conversation) {
    const stored = store.get(conversation.id);

    if (stored) {
      Object.assign(stored, conversation);
      stored.lastMessageAt = new Date();
    } else {
      store.set(conversation.id, { ...conversation, createdAt: new Date(), lastMessageAt: new Date() });
    }
  }

  let novuClient: Novu | null = null;

  function getNovuClient(): Novu {
    if (!novuClient) {
      const secret = options.novuSecretKey ?? process.env.NOVU_SECRET_KEY;

      if (!secret) {
        throw new Error('NOVU_SECRET_KEY is required for serveAgents()');
      }

      novuClient = createNovuApiClient({ secretKey: secret });
    }

    return novuClient;
  }

  function getNovuPersistCredentials(): { secretKey: string; serverURL: string } | null {
    const secretKey = options.novuSecretKey ?? process.env.NOVU_SECRET_KEY;

    if (!secretKey) {
      return null;
    }

    return { secretKey, serverURL: getNovuServerUrl() };
  }

  async function ensureNovuConversationRecord(
    conversation: Conversation,
    subscriberId: string,
    threadId: string
  ): Promise<string | undefined> {
    const existing = conversation.state.novuConversationId as string | undefined;

    if (existing) {
      return existing;
    }

    const persist = getNovuPersistCredentials();

    if (!persist) {
      return undefined;
    }

    try {
      const { id } = await createOrGetNovuConversation({
        ...persist,
        subscriberId,
        agentId: primaryAgent.id,
        platform: detectPlatform(threadId),
        platformThreadId: threadId,
      });
      conversation.state.novuConversationId = id;
      saveConversation(conversation);

      return id;
    } catch (err) {
      console.error('[novu] createOrGet conversation failed:', err);

      return undefined;
    }
  }

  async function persistNovuConversationMessages(
    conversationId: string | undefined,
    platform: string,
    entries: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      senderName?: string;
      platformMessageId?: string;
    }>
  ): Promise<void> {
    const persist = getNovuPersistCredentials();

    if (!persist) {
      return;
    }

    if (!conversationId) {
      console.error(
        '[novu] skip message persist: missing conversation id. Check the previous log for [novu] createOrGet conversation failed — often 404 means the demo called the wrong API path; ensure NOVU_API_BASE_URL matches your API host and that GLOBAL_CONTEXT_PATH / API_CONTEXT_PATH in the demo env match apps/api (e.g. /api/v1 vs /v1).'
      );

      return;
    }

    for (const entry of entries) {
      if (!entry.content.trim()) {
        continue;
      }

      try {
        await appendNovuConversationMessage({
          ...persist,
          conversationId,
          role: entry.role,
          content: entry.content,
          senderName: entry.senderName,
          platform,
          platformMessageId: entry.platformMessageId,
        });
      } catch (err) {
        console.error('[novu] append message failed:', err);
      }
    }
  }

  async function maybeSyncNovuConversationResolved(conversation: Conversation): Promise<void> {
    const novuConversationId = conversation.state.novuConversationId as string | undefined;

    if (!novuConversationId || conversation.status !== 'resolved') {
      return;
    }

    const persist = getNovuPersistCredentials();

    if (!persist) {
      return;
    }

    try {
      await updateNovuConversationStatus({
        ...persist,
        conversationId: novuConversationId,
        status: 'resolved',
      });
    } catch (err) {
      console.error('[novu] update conversation status failed:', err);
    }
  }

  let chatInstance: Chat | null = null;

  function getChat(): Chat {
    if (chatInstance) {
      return chatInstance;
    }

    const adapters = options.adapters ?? buildDefaultAdapters(primaryAgent.config.platforms);

    chatInstance = new Chat({
      userName: options.userName ?? primaryAgent.id,
      adapters,
      state: options.stateAdapter ?? createRedisState(),
      onLockConflict: options.onLockConflict ?? 'force',
    });

    async function buildHistory(thread: {
      allMessages: AsyncIterable<{ text: string; author: { isMe: boolean }; metadata?: { dateSent?: Date } }>;
    }): Promise<HistoryEntry[]> {
      const messages: HistoryEntry[] = [];

      for await (const msg of thread.allMessages) {
        messages.push({
          text: msg.text,
          isBot: msg.author.isMe,
          timestamp: msg.metadata?.dateSent?.toISOString() ?? new Date().toISOString(),
        });
      }

      return messages;
    }

    async function reactToRootMessage(thread: Thread): Promise<void> {
      for await (const msg of thread.allMessages) {
        const sent = thread.createSentMessageFromMessage(msg);
        await sent.addReaction(emoji.check);
        break;
      }
    }

    function getResponseText(response: string | RichResponse | void): string {
      if (!response) {
        return '';
      }

      if (typeof response === 'string') {
        return response;
      }

      return response.text;
    }

    async function resolveSubscriberForSlackMessage(author: MessageAuthor): Promise<string> {
      const platformUserId = author.userId;
      let resolvedId = platformUserId;

      if (options.resolveSubscriberId) {
        const custom = await options.resolveSubscriberId(platformUserId, 'slack');

        if (custom) {
          resolvedId = custom;
        } else if (slackUserResolver) {
          resolvedId = await slackUserResolver(platformUserId);
        }
      } else if (slackUserResolver) {
        resolvedId = await slackUserResolver(platformUserId);
      }

      if (options.slackIntegrationIdentifier) {
        const linkKey = `${resolvedId}::${platformUserId}`;

        if (!slackUserLinkCache.has(linkKey)) {
          await ensureSlackUserLinked(
            getNovuClient(),
            resolvedId,
            platformUserId,
            author.userName,
            options.slackIntegrationIdentifier
          );
          slackUserLinkCache.add(linkKey);
        }
      }

      return resolvedId;
    }

    async function resolveWhatsAppSubscriber(phoneNumber: string): Promise<string> {
      try {
        const res = await getNovuClient().subscribers.search({ phone: phoneNumber, limit: 1 });
        const match = res.result?.data?.[0];

        if (match?.subscriberId) {
          console.log(`[whatsapp] resolved phone ${phoneNumber} → subscriber ${match.subscriberId}`);

          return match.subscriberId;
        }
      } catch (err) {
        console.error(`[whatsapp] subscriber search by phone failed:`, err);
      }

      console.warn(`[whatsapp] no subscriber found for phone ${phoneNumber}, falling back to phone as subscriberId`);

      return phoneNumber;
    }

    async function resolveResendSubscriber(email: string): Promise<string> {
      try {
        const res = await getNovuClient().subscribers.search({ email, limit: 1 });
        const match = res.result?.data?.[0];

        if (match?.subscriberId) {
          console.log(`[resend] resolved email ${email} → subscriber ${match.subscriberId}`);

          return match.subscriberId;
        }
      } catch (err) {
        console.error(`[resend] subscriber search by email failed:`, err);
      }

      console.warn(`[resend] no subscriber found for email ${email}, falling back to email as subscriberId`);

      return email;
    }

    async function resolveSubscriber(threadId: string, author: MessageAuthor): Promise<string> {
      const platform = detectPlatform(threadId);

      if (options.resolveSubscriberId) {
        const custom = await options.resolveSubscriberId(author.userId, platform);

        if (custom) {
          return custom;
        }
      }

      if (platform === 'whatsapp') {
        return resolveWhatsAppSubscriber(author.userId);
      }

      if (platform === 'github') {
        return author.userName || author.userId;
      }

      if (platform === 'resend') {
        return resolveResendSubscriber(author.userId);
      }

      return resolveSubscriberForSlackMessage(author);
    }

    chatInstance.onNewMention(async (thread, message) => {
      console.log(`[${primaryAgent.id}] New mention from ${message.author.fullName} in ${thread.id}`);

      await thread.subscribe();

      const platform = detectPlatform(thread.id);
      const conversation = getOrCreateConversation(thread.id, message.author.userId);

      if (!conversation.participants.includes(message.author.userId)) {
        conversation.participants.push(message.author.userId);
      }

      const resolvedSubscriberId = await resolveSubscriber(thread.id, message.author);

      const subscriber = {
        subscriberId: resolvedSubscriberId,
        name: message.author.fullName,
      };

      const ensuredId = await ensureNovuConversationRecord(conversation, resolvedSubscriberId, thread.id);
      const novuConversationId = resolveNovuConversationId(conversation, ensuredId);

      await persistNovuConversationMessages(novuConversationId, platform, [
        {
          role: 'user',
          content: message.text,
          senderName: message.author.fullName,
          platformMessageId: readSlackMessageTs(message),
        },
      ]);

      const { response, signals } = await primaryAgent.handleSubscribe({
        conversation,
        subscriber,
        message: { text: message.text, author: message.author },
      });

      const text = getResponseText(response);

      await persistNovuConversationMessages(novuConversationId, platform, [
        { role: 'assistant', content: text, senderName: primaryAgent.id },
      ]);

      if (text) {
        await thread.post(text);
      }

      await executeSignals(signals, conversation, saveConversation, getNovuClient());

      const hasResolve = signals.some((s) => s.type === 'resolve');

      if (hasResolve) {
        await reactToRootMessage(thread);

        const { signals: resolveSignals } = await primaryAgent.handleResolve({ conversation, subscriber });
        await executeSignals(resolveSignals, conversation, saveConversation, getNovuClient());
        await thread.unsubscribe();
      }

      await maybeSyncNovuConversationResolved(conversation);
    });

    chatInstance.onSubscribedMessage(async (thread, message) => {
      console.log(`[${primaryAgent.id}] Message from ${message.author.fullName}: ${message.text.slice(0, 80)}`);

      const platform = detectPlatform(thread.id);
      const conversation = getOrCreateConversation(thread.id, message.author.userId);

      if (!conversation.participants.includes(message.author.userId)) {
        conversation.participants.push(message.author.userId);
      }

      const resolvedSubscriberId = await resolveSubscriber(thread.id, message.author);

      const subscriber = {
        subscriberId: resolvedSubscriberId,
        name: message.author.fullName,
      };

      const ensuredId = await ensureNovuConversationRecord(conversation, resolvedSubscriberId, thread.id);
      const novuConversationId = resolveNovuConversationId(conversation, ensuredId);

      await persistNovuConversationMessages(novuConversationId, platform, [
        {
          role: 'user',
          content: message.text,
          senderName: message.author.fullName,
          platformMessageId: readSlackMessageTs(message),
        },
      ]);

      const history = await buildHistory(thread);

      try {
        await thread.startTyping();
      } catch (err) {
        console.error(`[${platform}] start typing failed:`, err);
      }

      const { response, signals } = await primaryAgent.handleMessage({
        message: { text: message.text, author: message.author },
        conversation,
        subscriber,
        history: history.slice(0, -1),
      });

      const text = getResponseText(response);

      await persistNovuConversationMessages(novuConversationId, platform, [
        { role: 'assistant', content: text, senderName: primaryAgent.id },
      ]);

      if (text) {
        await thread.post(text);
      }

      await executeSignals(signals, conversation, saveConversation, getNovuClient());

      const hasResolve = signals.some((s) => s.type === 'resolve');

      if (hasResolve) {
        await reactToRootMessage(thread);

        const { signals: resolveSignals } = await primaryAgent.handleResolve({ conversation, subscriber });
        await executeSignals(resolveSignals, conversation, saveConversation, getNovuClient());
        await thread.unsubscribe();
      }

      await maybeSyncNovuConversationResolved(conversation);
    });

    return chatInstance;
  }

  async function handleWebhook(
    request: Request,
    context: { params: Promise<{ platform: string }> }
  ): Promise<Response> {
    const { platform } = await context.params;
    const chat = getChat();
    type Platform = keyof typeof chat.webhooks;

    const handler = chat.webhooks[platform as Platform];

    if (!handler) {
      return new Response(`Unknown platform: ${platform}`, { status: 404 });
    }

    return handler(request, {
      waitUntil: (task: Promise<unknown>) => {
        after(async () => {
          await task;
        });
      },
    });
  }

  handleWebhook.GET = handleWebhook;
  handleWebhook.POST = handleWebhook;

  return handleWebhook;
}
