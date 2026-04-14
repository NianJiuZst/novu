/**
 * Mock Agent Handler — E2E test utility
 *
 * Simulates a customer's serve() endpoint that receives bridge calls from Novu
 * and auto-replies back. Run alongside the Novu API to test the full agent round-trip.
 *
 * Usage:
 *   NOVU_API_KEY=<your-env-api-key> npx ts-node apps/api/src/app/agents/e2e/mock-agent-handler.ts
 *
 * Setup:
 *   1. Start Novu API: pnpm start:api:dev
 *   2. Set environment bridge URL to http://localhost:4111 (dashboard or direct DB update)
 *   3. Create an agent + link a Slack integration via the API
 *   4. Point Slack event subscriptions to your Novu webhook URL (ngrok/tunnel)
 *   5. @mention the bot in Slack — watch the round-trip in the logs
 */

import express from 'express';

const NOVU_API_KEY = process.env.NOVU_API_KEY;
const NOVU_API_URL = process.env.NOVU_API_URL || 'http://localhost:3000';
const PORT = Number(process.env.MOCK_PORT) || 4111;

if (!NOVU_API_KEY) {
  console.error('NOVU_API_KEY is required. Set it to your environment API key.');
  process.exit(1);
}

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
  const { action, agentId, event } = req.query as Record<string, string>;

  console.log('\n─────────────────────────────────────────');
  console.log(`Bridge call received: action=${action} agentId=${agentId} event=${event}`);
  console.log('─────────────────────────────────────────');

  const payload = req.body;

  console.log('Event:', payload.event);
  console.log('Agent:', payload.agentId);
  console.log('Conversation:', payload.conversation?.identifier, `(status: ${payload.conversation?.status})`);
  console.log('Subscriber:', payload.subscriber?.subscriberId ?? 'null (unlinked platform user)');
  console.log('Message:', payload.message?.text ?? '(no message)');
  console.log('History entries:', payload.history?.length ?? 0);
  console.log('Platform:', payload.platform, payload.platformContext?.isDM ? '(DM)' : '(channel)');
  console.log('Reply URL:', payload.replyUrl);
  console.log('Conversation ID:', payload.conversationId);
  console.log('Integration:', payload.integrationIdentifier);

  res.status(200).json({ status: 'ack' });

  if (payload.event === 'onResolve') {
    console.log('\nonResolve — no reply needed. Conversation closed.');

    return;
  }

  const replyBody = buildReply(payload);
  console.log('\nSending reply:', JSON.stringify(replyBody, null, 2));

  try {
    const replyUrl = `${NOVU_API_URL}/v1/agents/${payload.agentId}/reply`;
    console.log('Reply URL:', replyUrl);

    const replyRes = await fetch(replyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${NOVU_API_KEY}`,
      },
      body: JSON.stringify(replyBody),
    });

    const responseBody = await replyRes.text();
    console.log(`Reply response: ${replyRes.status} ${responseBody}`);
  } catch (err) {
    console.error('Reply failed:', err);
  }
});

function buildReply(payload: Record<string, unknown>) {
  const event = payload.event as string;
  const message = payload.message as { text: string } | null;
  const conversation = payload.conversation as { identifier: string; metadata: Record<string, unknown> } | undefined;
  const conversationId = payload.conversationId as string;
  const integrationIdentifier = payload.integrationIdentifier as string;

  const base = { conversationId, integrationIdentifier };

  const userText = message?.text ?? '';

  if (userText.toLowerCase().includes('done')) {
    return {
      ...base,
      reply: { text: 'Thanks for chatting! Resolving this conversation.' },
      resolve: { summary: `Conversation resolved after ${(conversation?.metadata as Record<string, unknown>)?.turnCount ?? '?'} turns` },
      signals: [{ type: 'metadata', key: 'turnCount', value: ((conversation?.metadata as Record<string, unknown>)?.turnCount as number ?? 0) + 1 }],
    };
  }

  const turnCount = ((conversation?.metadata as Record<string, unknown>)?.turnCount as number) ?? 0;

  return {
    ...base,
    reply: { text: `Echo: ${userText}` },
    signals: [{ type: 'metadata', key: 'turnCount', value: turnCount + 1 }],
  };
}

app.listen(PORT, () => {
  console.log(`\nMock Agent Handler running on http://localhost:${PORT}`);
  console.log(`Novu API: ${NOVU_API_URL}`);
  console.log(`API Key: ${NOVU_API_KEY.slice(0, 10)}...`);
  console.log('\nWaiting for bridge calls...\n');
});
