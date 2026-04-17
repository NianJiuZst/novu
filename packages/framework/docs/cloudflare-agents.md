# Cloudflare Agents Integration

Deploy Novu agents on Cloudflare Workers using Durable Objects for per-conversation state, scheduling, and multi-channel delivery.

## Install

```bash
npm install @novu/framework agents @cloudflare/ai-chat
```

## Quick start

```ts
// src/index.ts
import { AIChatAgent } from '@cloudflare/ai-chat';
import { routeAgentRequest } from 'agents';
import { withNovuAgent, createNovuRouter, type NovuConversationRef } from '@novu/framework/cloudflare';

export class WineBot extends withNovuAgent(AIChatAgent)<Env> {
  static novuAgentId = 'wine-bot';

  async onNovuMessage(ctx) {
    await ctx.reply({ markdown: `You said: **${ctx.message?.text}**` });

    // Schedule a follow-up using the serialized conversation ref
    this.schedule('2h', 'followUp', ctx.serialize());
  }

  async followUp(ref: NovuConversationRef) {
    await this.replyFromRef(ref, { markdown: 'Still thinking about that pairing?' });
  }
}

export default {
  fetch: createNovuRouter({
    agents: { WineBot },
    fallthrough: routeAgentRequest,
  }),
};
```

`wrangler.jsonc`:

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "WineBot", "class_name": "WineBot" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["WineBot"] }]
}
```

Set the secret key:

```bash
wrangler secret put NOVU_SECRET_KEY
```

In the Novu dashboard, create an agent with identifier `wine-bot` and set the Bridge URL to your Worker URL.

## API Reference

### `withNovuAgent(Base)`

A class mixin that adds Novu lifecycle hooks to any Cloudflare `Agent` or `AIChatAgent`:

```ts
export class MyBot extends withNovuAgent(AIChatAgent)<Env> {
  static novuAgentId = 'my-bot';  // must match the Novu agent identifier

  async onNovuMessage(ctx) { /* ... */ }
  async onNovuAction(ctx) { /* ... */ }
  async onNovuReaction(ctx) { /* ... */ }
  async onNovuResolve(ctx) { /* ... */ }
}
```

#### Lifecycle hooks

| Hook | When it fires |
|------|-------------|
| `onNovuMessage(ctx)` | Inbound message from any channel |
| `onNovuAction(ctx)` | Interactive element action (button click, select) |
| `onNovuReaction(ctx)` | Emoji reaction added/removed |
| `onNovuResolve(ctx)` | Conversation resolved |

#### Instance methods

| Method | Description |
|--------|-------------|
| `replyFromRef(ref, content)` | Reply to a conversation using a `NovuConversationRef`. Works from any context: `schedule`, `@callable`, `onEmail`. |
| `triggerWorkflow(workflowId, opts?)` | Trigger a Novu workflow from anywhere in the DO. |

### `toMessageList(ctx)`

Converts `ctx.history` + `ctx.message` into a `{ role, content }[]` array ready for any LLM client:

```ts
import { toMessageList } from '@novu/framework/cloudflare';

async onNovuMessage(ctx) {
  const result = await generateText({
    model: workersai('@cf/meta/llama-3.3-70b-instruct'),
    messages: toMessageList(ctx),
  });
  await ctx.reply({ markdown: result.text });
}
```

Role mapping: `'agent'` / `'assistant'` → `'assistant'`, `'system'` → `'system'`, everything else → `'user'`. The current inbound message (if present) is appended as the final user turn.

### `createNovuRouter(options)`

Worker `fetch` handler that routes bridge traffic to DOs and delegates everything else.

```ts
createNovuRouter({
  agents: { WineBot, SupportBot },    // binding name → class
  workflows: [handoffWorkflow],       // optional Novu workflows
  fallthrough: routeAgentRequest,     // optional — Cloudflare Agents SDK routing
})
```

Order of operations:

1. `POST ?action=agent-event` → verify HMAC, route to the DO via `getAgentByName(env.X, conversationId)`
2. Other `action` values (`trigger`, `execute`, `preview`, `health-check`, `discover`) → delegate to `NovuRequestHandler`
3. No action match → `fallthrough` (e.g. `routeAgentRequest` for Cloudflare SDK's `/agents/*` routing)
4. Nothing matches → `404`

### `ctx.serialize()` → `NovuConversationRef`

Returns a JSON-safe ref you can pass to any persistence mechanism:

```ts
type NovuConversationRef = {
  replyUrl: string;
  conversationId: string;
  integrationIdentifier: string;
};
```

| Persistence path | How |
|-----------------|-----|
| Schedule payload | `this.schedule('2h', 'method', ctx.serialize())` |
| DO state | `this.setState({ ref: ctx.serialize() })` |
| DO SQL | `this.sql\`INSERT ... VALUES (${JSON.stringify(ctx.serialize())})\`` |
| Workflow payload | Pass as workflow step input |

The Novu secret key is **never** in the ref — it's always read from `this.env.NOVU_SECRET_KEY` at call time.

### `verifyNovuSignature`

For custom routing scenarios where you need to verify outside the router:

```ts
import { verifyNovuSignature } from '@novu/framework/cloudflare';

await verifyNovuSignature(body, signatureHeader, secretKey, true);
```

## Opt-in helpers

For users who want automatic "last ref" tracking:

```ts
import { rememberLastRef, replyToLastConversation } from '@novu/framework/cloudflare/helpers';

class Bot extends withNovuAgent(Agent)<Env> {
  async onNovuMessage(ctx) {
    rememberLastRef(this, ctx);
    await ctx.reply('Got it!');
  }

  async scheduledTask() {
    await replyToLastConversation(this, { markdown: 'Still there?' });
  }
}
```

These helpers write `ctx.serialize()` to `this.setState()` under a private key. Import them explicitly from `@novu/framework/cloudflare/helpers` — the default mixin has zero implicit state writes.

## How it compares to other adapters

| Feature | `@novu/framework/lambda` | `@novu/framework/cloudflare` |
|---------|------------------------|----------------------------|
| Per-conversation state | None (stateless) | Built-in DO SQL + state |
| Deferred replies | Not possible | `schedule` + `replyFromRef` |
| React/WebSocket clients | Not supported | Works via `routeAgentRequest` fallthrough |

The Cloudflare adapter is the only one that leverages the hosting platform's state primitives. Other adapters treat the bridge endpoint as stateless.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NOVU_SECRET_KEY` | Yes | Novu API secret key (set via `wrangler secret put`) |
| `NOVU_API_URL` | No | Override for self-hosted Novu (defaults to `https://api.novu.co`) |
