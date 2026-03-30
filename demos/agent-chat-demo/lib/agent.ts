import { createRedisState } from '@chat-adapter/state-redis';
import { createSlackAdapter } from '@chat-adapter/slack';
import { Novu } from '@novu/node';
import { after } from 'next/server';
import { Chat } from 'chat';

type ChatAdapters = NonNullable<ConstructorParameters<typeof Chat>[0]['adapters']>;

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
          await novuClient.trigger(signal.workflowId, {
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
};

function buildDefaultAdapters(platforms?: string[]): ChatAdapters {
  const map = {} as ChatAdapters;
  const list = platforms?.length ? platforms : ['slack'];

  for (const platform of list) {
    if (platform === 'slack') {
      map.slack = createSlackAdapter();
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

      novuClient = new Novu(secret);
    }

    return novuClient;
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

    function getResponseText(response: string | RichResponse | void): string {
      if (!response) {
        return '';
      }

      if (typeof response === 'string') {
        return response;
      }

      return response.text;
    }

    chatInstance.onNewMention(async (thread, message) => {
      console.log(`[${primaryAgent.id}] New mention from ${message.author.fullName} in ${thread.id}`);

      await thread.subscribe();

      const conversation = getOrCreateConversation(thread.id, message.author.userId);

      if (!conversation.participants.includes(message.author.userId)) {
        conversation.participants.push(message.author.userId);
      }

      const subscriber = {
        subscriberId: message.author.userId,
        name: message.author.fullName,
      };

      const { response, signals } = await primaryAgent.handleSubscribe({
        conversation,
        subscriber,
        message: { text: message.text, author: message.author },
      });

      const text = getResponseText(response);

      if (text) {
        await thread.post(text);
      }

      await executeSignals(signals, conversation, saveConversation, getNovuClient());

      const hasResolve = signals.some((s) => s.type === 'resolve');

      if (hasResolve) {
        const { signals: resolveSignals } = await primaryAgent.handleResolve({ conversation, subscriber });
        await executeSignals(resolveSignals, conversation, saveConversation, getNovuClient());
        await thread.unsubscribe();
      }
    });

    chatInstance.onSubscribedMessage(async (thread, message) => {
      console.log(`[${primaryAgent.id}] Message from ${message.author.fullName}: ${message.text.slice(0, 80)}`);

      const conversation = getOrCreateConversation(thread.id, message.author.userId);

      if (!conversation.participants.includes(message.author.userId)) {
        conversation.participants.push(message.author.userId);
      }

      const subscriber = {
        subscriberId: message.author.userId,
        name: message.author.fullName,
      };

      const history = await buildHistory(thread);

      await thread.startTyping();

      const { response, signals } = await primaryAgent.handleMessage({
        message: { text: message.text, author: message.author },
        conversation,
        subscriber,
        history: history.slice(0, -1),
      });

      const text = getResponseText(response);

      if (text) {
        await thread.post(text);
      }

      await executeSignals(signals, conversation, saveConversation, getNovuClient());

      const hasResolve = signals.some((s) => s.type === 'resolve');

      if (hasResolve) {
        const { signals: resolveSignals } = await primaryAgent.handleResolve({ conversation, subscriber });
        await executeSignals(resolveSignals, conversation, saveConversation, getNovuClient());
        await thread.unsubscribe();
      }
    });

    return chatInstance;
  }

  return async function POST(
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
      waitUntil: (task: Promise<unknown>) => after(() => task),
    });
  };
}
