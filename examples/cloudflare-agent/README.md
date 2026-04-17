# Novu + Cloudflare Agents Example

A minimal example showing how to connect a Cloudflare `AIChatAgent` Durable Object to Novu's multi-channel delivery (Slack, WhatsApp, Teams, etc.).

## How it works

1. A user sends a message in Slack (or WhatsApp, Teams, etc.)
2. Novu receives the webhook and normalizes it
3. Novu POSTs a signed `AgentBridgeRequest` to your Worker's bridge URL
4. `createNovuRouter` verifies the HMAC and routes to the correct Durable Object (keyed by conversation ID)
5. `withNovuAgent` intercepts the request inside the DO and calls your `onNovuMessage` handler
6. Your handler calls `ctx.reply()` which POSTs back to Novu
7. Novu delivers the reply to the original channel

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set your Novu secret key

```bash
wrangler secret put NOVU_SECRET_KEY
```

Paste the secret key from your Novu dashboard (Settings > API Keys).

### 3. Deploy

```bash
npm run deploy
```

### 4. Connect to Novu

In the Novu dashboard:

1. Go to **Agents** and create an agent with identifier `wine-bot`
2. Set the **Bridge URL** to `https://<your-worker>.workers.dev/`
3. Add a channel integration (Slack, WhatsApp, etc.) to the agent

That's it. Messages from the connected channel will now flow through your Cloudflare Agent.

## Local development

```bash
npm run dev
```

Use `wrangler dev --remote` for a stable URL that Novu can reach, or use a tunnel like `cloudflared tunnel`.

## Key concepts

- **`withNovuAgent(AIChatAgent)`** — mixin that adds `onNovuMessage`, `onNovuAction`, `onNovuReaction`, `onNovuResolve` lifecycle hooks to any Cloudflare Agent class
- **`createNovuRouter`** — Worker fetch handler that verifies Novu signatures, routes bridge calls to the right DO, and falls through to `routeAgentRequest` for standard Cloudflare Agent traffic
- **`ctx.serialize()`** — returns a `NovuConversationRef` you can pass to `this.schedule()`, `this.setState()`, or any other persistence mechanism to reply later
- **`this.replyFromRef(ref, content)`** — reply to a Novu conversation from any context (scheduled task, `@callable`, `onEmail`, etc.)
