# Novu Agent Platform — Future Deep Integrations

Building on top of the Wine Bot demo POC (`demos/agent-chat-demo/`), this document outlines how the current stitched-together integration evolves into native Novu magic.

## Current State: Where the Seams Are Visible

The demo has five places where the integration feels stitched rather than native:

1. **`bot.ts` is glue code** — 70+ lines of boilerplate wiring Chat SDK events to the agent handler, managing subscriptions, building history, executing signals. Every agent developer would have to write this.
2. **Subscriber identity is manual** — The Inbox page requires the user to type their Slack user ID. No automatic mapping between chat platform identity and Novu subscriber.
3. **Conversation state is disconnected** — The in-memory `conversation-store.ts` is separate from Novu. The Inbox has no awareness of conversation state.
4. **Workflows are disconnected from conversations** — The `wine-recommendations-ready` workflow fires a generic `inApp` notification with no link back to the conversation thread.
5. **The Inbox is one-way** — Shows notifications but can't reply, continue conversations, or interact with the agent from the web.

---

## Integration 1: Auto-Wiring — Kill `bot.ts` Entirely

**Today:** Developer writes `bot.ts` manually — wiring Chat SDK events to agent handler, managing subscriptions, building history, executing signals.

**Magic version:** The agent registers itself and Novu handles all the plumbing.

```typescript
// agents/wine-bot.ts — the ENTIRE file the customer writes
import { agent } from '@novu/agent';
import OpenAI from 'openai';

const openai = new OpenAI();

export const wineBot = agent('wine-bot', {
  onMessage: async ({ message, conversation, history, novu }) => {
    const response = await openai.chat.completions.create({ ... });
    novu.state.increment('messageCount');
    return response.choices[0].message.content;
  },
  config: { platforms: ['slack'] },
});
```

```typescript
// app/api/agent/route.ts
import { serveAgents } from '@novu/agent/next';
import { wineBot } from '@/agents/wine-bot';

export const { GET, POST } = serveAgents({ agents: [wineBot] });
```

**How it works:** `serveAgents` is the agent equivalent of the framework's `serve()`. It:
- Registers Chat SDK adapters based on `config.platforms` (reading env vars automatically)
- Creates the Chat SDK instance internally
- Wires `onNewMention` -> `agent.handleSubscribe()` automatically
- Wires `onSubscribedMessage` -> `agent.handleMessage()` automatically
- Manages conversation state in Novu's State Service
- Executes signals through Novu's API
- Handles webhook routing

**Result:** `bot.ts`, `conversation-store.ts`, and the manual webhook route all disappear. They become internal infrastructure.

---

## Integration 2: Subscriber Auto-Identification

**Today:** Slack user `U07XXXXXX` must manually enter their ID in the web page to connect their Inbox.

**Magic version:** When an agent first encounters a platform user, Novu automatically upserts a subscriber and links their platform identity:

```typescript
// Happens automatically inside the signal executor
await novuClient.subscribers.identify(message.author.userId, {
  firstName: message.author.fullName.split(' ')[0],
  lastName: message.author.fullName.split(' ').slice(1).join(' '),
  data: {
    slackUserId: message.author.userId,
    slackUserName: message.author.userName,
  },
});
```

On the web, the Inbox authenticates via session and the subscriber is already linked. User logs in, Inbox already has wine recommendations — Slack user was mapped to their subscriber profile automatically.

**Effort from demo:** Small — add to signal executor in `agent.ts`.

---

## Integration 3: Conversation-Aware Inbox Notifications

**Today:** The `inApp` notification is a flat message — "Your sommelier picked 3 wines." No connection to conversation context.

**Magic version:** Notifications carry conversation context with deep-links:

```typescript
await step.inApp('notify', async () => ({
  subject: `Your sommelier picked ${payload.recommendationCount} wines`,
  body: payload.lastRecommendation,
  data: {
    conversationId: payload.conversationId,
    agentId: 'wine-bot',
  },
  primaryAction: {
    label: 'Continue in Slack',
    redirect: {
      url: `slack://channel?id=${payload.slackChannelId}&message=${payload.slackThreadTs}`,
      target: '_blank',
    },
  },
  secondaryAction: {
    label: 'View Recommendations',
    redirect: { url: `/conversations/${payload.conversationId}` },
  },
}));
```

Uses existing `InboxNotification` shape — `primaryAction`, `secondaryAction`, `data`, `redirect` all exist in `packages/js/src/types.ts`. No platform changes needed.

**Effort from demo:** Tiny — modify `workflows.ts` to include `data` and action fields.

---

## Integration 4: Conversation Thread in the Inbox

**Today:** Inbox shows flat notification cards. The conversation lives only in Slack.

**Magic version:** Inbox renders a conversation thread view. Click a wine recommendation notification, it expands to show conversation history — and you can continue from the web:

```typescript
<Inbox
  applicationIdentifier={NOVU_APP_ID}
  subscriberId={activeId}
  renderNotification={(notification) => {
    if (notification.data?.conversationId) {
      return <ConversationCard notification={notification} />;
    }
    return undefined; // default rendering
  }}
/>
```

`<ConversationCard>` uses `notification.data.conversationId` to fetch conversation history from a new Novu API endpoint (`GET /conversations/:id/messages`) and renders it inline.

**What changes in Novu:** New Conversation API for message storage and retrieval. Inbox component gets a conversation rendering mode.

**Effort:** Large — new API + UI component. But this is the "wow" moment.

---

## Integration 5: Declarative Signal Workflows via Config

**Today:** Developer manually writes `if (count >= 3) novu.trigger(...)` in the agent handler.

**Magic version:** Signals are declared in config, Novu evaluates them reactively:

```typescript
export const wineBot = agent('wine-bot', {
  onMessage: async ({ message, history, novu }) => {
    const response = await callAI(message.text, history);
    novu.state.increment('messageCount');
    novu.state.increment('recommendationCount');
    novu.state.set({ preferences: detectPreferences(message.text) });
    return response;
  },

  // Declarative: "when state matches condition, trigger workflow"
  signals: {
    'wine-recommendations-ready': {
      when: (state) => (state.recommendationCount as number) >= 3,
      once: true,
      payload: (state, conversation) => ({
        recommendationCount: state.recommendationCount,
        conversationId: conversation.id,
      }),
    },
    'wine-session-summary': {
      on: 'resolve',
      payload: (state) => ({
        messageCount: state.messageCount,
        preferences: state.preferences,
      }),
    },
  },

  config: { platforms: ['slack'] },
});
```

Agent handler becomes pure AI logic. Signal conditions are reactive rules Novu evaluates after every state update.

**Enables:** Visual dashboard for signal rules. Product managers modify when workflows fire without touching code.

---

## Integration 6: `novu.notify()` — Direct Chat-to-Notification Bridge

**Today:** Agent returns text to chat AND separately triggers workflows. Two unrelated actions.

**Magic version:** One-liner creates in-app notification without a separate workflow:

```typescript
onMessage: async ({ message, history, novu }) => {
  const response = await callAI(message.text, history);

  // No workflow needed — direct notification
  novu.notify({
    subject: 'Wine recommendation saved',
    body: response.slice(0, 150),
    tags: ['wine-recommendation'],
  });

  return response;
},
```

`novu.notify()` is sugar that creates an ad-hoc `inApp` notification. Under the hood, Novu generates a transient workflow and triggers it.

**Effort from demo:** Small — add method to `NovuContext` class.

---

## Integration 7: Preference-Gated Responses

**Today:** Agent always responds. No user control.

**Magic version:** Novu's existing preference engine gates agent communication:

```typescript
export const wineBot = agent('wine-bot', {
  // ...handlers...
  config: {
    platforms: ['slack', 'web'],
    preferences: {
      channels: { chat: true, in_app: true, email: false },
      overridable: true,
    },
  },
});
```

Before `onMessage` is called, Novu checks subscriber preferences. If opted out of `chat` for this agent, message is dropped. If opted out of `in_app`, `novu.trigger()` calls skip the inApp step.

Uses the exact preference resolution in `libs/application-generic/src/usecases/get-subscriber-template-preference/`.

---

## Integration 8: Conversation Analytics via Existing Pipeline

**Today:** Agent activity is invisible to Novu analytics.

**Magic version:** Every agent message becomes a trackable event in the existing delivery lifecycle:

- `onSubscribe` -> `conversation_started`
- Each `onMessage` -> `conversation_message_delivered`
- `onResolve` -> `conversation_resolved`

Flows through existing `TraceLogRepository` and `WorkflowRunRepository`, appearing in the dashboard alongside notification metrics.

---

## Priority Map

| # | Integration | Effort from demo | Impact |
|---|---|---|---|
| 3 | Conversation-aware Inbox notifications | Tiny | High — makes demo more compelling immediately |
| 2 | Subscriber auto-identification | Small | High — removes friction |
| 6 | `novu.notify()` one-liner | Small | Medium — great DX improvement |
| 1 | Auto-wiring (`serveAgents`) | Medium | Very high — eliminates boilerplate |
| 5 | Declarative signal workflows | Medium | High — separates AI from orchestration |
| 7 | Preference-gated responses | Medium | Medium — enterprise differentiator |
| 4 | Conversation thread in Inbox | Large | Very high — the "wow" moment |
| 8 | Conversation analytics | Medium | Medium — makes value measurable |

---

## Key Architecture Decisions (from earlier design sessions)

### agent() vs workflow()

- `workflow()` is finite: triggered -> runs steps -> completes. Good for notifications.
- `agent()` is continuous: subscribed -> invoked per-message -> eventually resolved. Good for conversations.
- They connect via signals: `agent.onMessage` can `novu.trigger()` a workflow. A workflow `step.chat()` can post into a conversation. But they are separate primitives with separate lifecycles.

### The execution boundary

- **Customer owns:** What the agent says (LLM, RAG, tools, business logic). Deployed as CF Worker resolver or bridge.
- **Novu owns:** How/when/where the agent communicates (routing, delivery, preferences, throttle, digest, analytics).

### The novu context API

- Signals are expressed as imperative method calls (`novu.state.set()`, `novu.trigger()`, `novu.resolve()`), not as a return object.
- The `NovuContext` is a collector — methods queue intents, the executor runs them after the handler completes.
- The return value is just the response text. Everything else is side effects via `novu.*`.

### State adapter

- Pure Novu state adapter doesn't work (no distributed locking primitive, HTTP latency too high for hot path).
- Hybrid approach: Redis for hot path (locks, cache, subscription checks), Novu for conversation graph (side effect of subscription changes creating Topics and Conversation entities).
- The pitch: "Every `thread.subscribe()` now unlocks the entire Novu notification platform for that conversation."
