import { Novu } from '@novu/node';

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
