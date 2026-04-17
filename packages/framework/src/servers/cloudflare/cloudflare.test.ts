import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentContextImpl } from '../../resources/agent/agent.context';
import type { AgentBridgeRequest, NovuConversationRef } from '../../resources/agent/agent.types';
import { validateNovuSignature } from '../../utils/signature.utils';
import { createHmacSubtle } from '../../utils/crypto.utils';

function createMockBridgeRequest(overrides?: Partial<AgentBridgeRequest>): AgentBridgeRequest {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    deliveryId: 'del-123',
    event: 'onMessage',
    agentId: 'test-bot',
    replyUrl: 'https://api.novu.co/v1/agents/test-bot/reply',
    conversationId: 'conv-456',
    integrationIdentifier: 'slack-main',
    action: null,
    reaction: null,
    message: {
      text: 'Hello bot!',
      platformMessageId: 'msg-789',
      author: { userId: 'u1', fullName: 'Alice', userName: 'alice', isBot: false },
      timestamp: new Date().toISOString(),
    },
    conversation: {
      identifier: 'conv-456',
      status: 'active',
      metadata: {},
      messageCount: 1,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    },
    subscriber: {
      subscriberId: 'sub-001',
      firstName: 'Alice',
      email: 'alice@example.com',
    },
    history: [],
    platform: 'slack',
    platformContext: { threadId: 't1', channelId: 'c1', isDM: false },
    ...overrides,
  };
}

describe('AgentContextImpl.serialize()', () => {
  it('should return a NovuConversationRef with the correct fields', () => {
    const body = createMockBridgeRequest();
    const ctx = new AgentContextImpl(body, 'test-secret');

    const ref = ctx.serialize();

    expect(ref).toEqual({
      replyUrl: 'https://api.novu.co/v1/agents/test-bot/reply',
      conversationId: 'conv-456',
      integrationIdentifier: 'slack-main',
    });
  });

  it('should return the same ref on multiple calls', () => {
    const body = createMockBridgeRequest();
    const ctx = new AgentContextImpl(body, 'test-secret');

    const ref1 = ctx.serialize();
    const ref2 = ctx.serialize();

    expect(ref1).toEqual(ref2);
  });

  it('should be JSON-safe (round-trips through JSON)', () => {
    const body = createMockBridgeRequest();
    const ctx = new AgentContextImpl(body, 'test-secret');

    const ref = ctx.serialize();
    const roundTripped = JSON.parse(JSON.stringify(ref)) as NovuConversationRef;

    expect(roundTripped).toEqual(ref);
  });
});

describe('validateNovuSignature()', () => {
  const secretKey = 'test-secret-key';
  const payload = { foo: 'bar' };

  async function buildSignatureHeader(secret: string, body: unknown): Promise<string> {
    const timestamp = Date.now();
    const hash = await createHmacSubtle(secret, `${timestamp}.${JSON.stringify(body)}`);

    return `t=${timestamp},v1=${hash}`;
  }

  it('should pass for a valid signature', async () => {
    const header = await buildSignatureHeader(secretKey, payload);

    await expect(validateNovuSignature(payload, header, secretKey, true)).resolves.toBeUndefined();
  });

  it('should skip validation when hmacEnabled is false', async () => {
    await expect(validateNovuSignature(payload, null, undefined, false)).resolves.toBeUndefined();
  });

  it('should throw SignatureNotFoundError when header is null', async () => {
    await expect(validateNovuSignature(payload, null, secretKey, true)).rejects.toThrow('Signature not found');
  });

  it('should throw SigningKeyNotFoundError when secretKey is missing', async () => {
    await expect(validateNovuSignature(payload, 'some-header', undefined, true)).rejects.toThrow(
      'Signature key not found'
    );
  });

  it('should throw SignatureInvalidError when header format is wrong', async () => {
    await expect(validateNovuSignature(payload, 'bad-format', secretKey, true)).rejects.toThrow(
      'Signature is invalid'
    );
  });

  it('should throw SignatureMismatchError for wrong secret', async () => {
    const header = await buildSignatureHeader('wrong-secret', payload);

    await expect(validateNovuSignature(payload, header, secretKey, true)).rejects.toThrow(
      'Signature does not match'
    );
  });

  it('should throw SignatureExpiredError for old timestamps', async () => {
    const oldTimestamp = Date.now() - 1000 * 60 * 60;
    const hash = await createHmacSubtle(secretKey, `${oldTimestamp}.${JSON.stringify(payload)}`);
    const header = `t=${oldTimestamp},v1=${hash}`;

    await expect(validateNovuSignature(payload, header, secretKey, true)).rejects.toThrow('Signature expired');
  });

  it('should throw SignatureVersionInvalidError for wrong version', async () => {
    const timestamp = Date.now();
    const hash = await createHmacSubtle(secretKey, `${timestamp}.${JSON.stringify(payload)}`);
    const header = `t=${timestamp},v2=${hash}`;

    await expect(validateNovuSignature(payload, header, secretKey, true)).rejects.toThrow('Signature version is invalid');
  });
});

describe('withNovuAgent mixin', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{}'),
      json: () => Promise.resolve({ status: 'ok' }),
    });
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('replyFromRef should POST to the replyUrl with correct auth and body', async () => {
    const { withNovuAgent } = await import('./with-novu-agent');

    class FakeAgent {
      env = { NOVU_SECRET_KEY: 'my-secret' };
    }

    class TestBot extends withNovuAgent(FakeAgent as any) {
      static novuAgentId = 'test-bot';
    }

    const bot = new TestBot() as any;

    const ref: NovuConversationRef = {
      replyUrl: 'https://api.novu.co/v1/agents/test-bot/reply',
      conversationId: 'conv-123',
      integrationIdentifier: 'slack-main',
    };

    await bot.replyFromRef(ref, 'Hello from schedule!');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.novu.co/v1/agents/test-bot/reply');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('ApiKey my-secret');

    const body = JSON.parse(opts.body);
    expect(body.conversationId).toBe('conv-123');
    expect(body.integrationIdentifier).toBe('slack-main');
    expect(body.reply.text).toBe('Hello from schedule!');
  });

  it('replyFromRef should throw when NOVU_SECRET_KEY is missing', async () => {
    const { withNovuAgent } = await import('./with-novu-agent');

    class FakeAgent {
      env = {};
    }

    class TestBot extends withNovuAgent(FakeAgent as any) {
      static novuAgentId = 'test-bot';
    }

    const bot = new TestBot() as any;
    const ref: NovuConversationRef = {
      replyUrl: 'https://api.novu.co/v1/agents/test-bot/reply',
      conversationId: 'conv-123',
      integrationIdentifier: 'slack-main',
    };

    await expect(bot.replyFromRef(ref, 'hi')).rejects.toThrow('NOVU_SECRET_KEY');
  });

  it('replyFromRef should throw when the reply endpoint returns non-ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    const { withNovuAgent } = await import('./with-novu-agent');

    class FakeAgent {
      env = { NOVU_SECRET_KEY: 'my-secret' };
    }

    class TestBot extends withNovuAgent(FakeAgent as any) {
      static novuAgentId = 'test-bot';
    }

    const bot = new TestBot() as any;
    const ref: NovuConversationRef = {
      replyUrl: 'https://api.novu.co/v1/agents/test-bot/reply',
      conversationId: 'conv-123',
      integrationIdentifier: 'slack-main',
    };

    await expect(bot.replyFromRef(ref, 'hi')).rejects.toThrow('replyFromRef failed (401)');
  });

});

describe('helpers: rememberLastRef / replyToLastConversation', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{}'),
    });
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('round-trips a ref through setState / state', async () => {
    const { rememberLastRef, replyToLastConversation } = await import('./helpers');

    let storedState: Record<string, unknown> = { other: 'keep-me' };

    const fakeAgent = {
      env: { NOVU_SECRET_KEY: 'test-key' },
      state: storedState,
      setState(newState: Record<string, unknown>) {
        storedState = newState;
        this.state = storedState;
      },
    };

    const body = createMockBridgeRequest();
    const ctx = new AgentContextImpl(body, 'test-key');

    rememberLastRef(fakeAgent, ctx);

    expect(storedState.__novuLastRef).toEqual({
      replyUrl: 'https://api.novu.co/v1/agents/test-bot/reply',
      conversationId: 'conv-456',
      integrationIdentifier: 'slack-main',
    });
    expect(storedState.other).toBe('keep-me');

    await replyToLastConversation(fakeAgent, 'ping');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.novu.co/v1/agents/test-bot/reply');

    const sentBody = JSON.parse(opts.body);
    expect(sentBody.reply.text).toBe('ping');
    expect(sentBody.conversationId).toBe('conv-456');
  });

  it('replyToLastConversation throws when no ref was stored', async () => {
    const { replyToLastConversation } = await import('./helpers');

    const fakeAgent = {
      env: { NOVU_SECRET_KEY: 'test-key' },
      state: {},
      setState() {},
    };

    await expect(replyToLastConversation(fakeAgent, 'hello')).rejects.toThrow(
      'No conversation ref stored'
    );
  });
});

describe('toMessageList()', () => {
  it('should map history + current message into LLM messages', async () => {
    const { toMessageList } = await import('./convert-history');

    const body = createMockBridgeRequest({
      history: [
        { role: 'subscriber', type: 'message', content: 'Hi there', createdAt: '2025-01-01T00:00:00Z' },
        { role: 'agent', type: 'message', content: 'Hello! How can I help?', createdAt: '2025-01-01T00:00:01Z' },
      ],
      message: {
        text: 'Tell me about Merlot',
        platformMessageId: 'msg-2',
        author: { userId: 'u1', fullName: 'Alice', userName: 'alice', isBot: false },
        timestamp: new Date().toISOString(),
      },
    });
    const ctx = new AgentContextImpl(body, 'test-secret');

    const messages = toMessageList(ctx);

    expect(messages).toEqual([
      { role: 'user', content: 'Hi there' },
      { role: 'assistant', content: 'Hello! How can I help?' },
      { role: 'user', content: 'Tell me about Merlot' },
    ]);
  });

  it('should handle empty history with only current message', async () => {
    const { toMessageList } = await import('./convert-history');

    const body = createMockBridgeRequest({ history: [] });
    const ctx = new AgentContextImpl(body, 'test-secret');

    const messages = toMessageList(ctx);

    expect(messages).toEqual([{ role: 'user', content: 'Hello bot!' }]);
  });

  it('should handle history only (no current message)', async () => {
    const { toMessageList } = await import('./convert-history');

    const body = createMockBridgeRequest({
      message: null,
      history: [
        { role: 'subscriber', type: 'message', content: 'Previous msg', createdAt: '2025-01-01T00:00:00Z' },
      ],
    });
    const ctx = new AgentContextImpl(body, 'test-secret');

    const messages = toMessageList(ctx);

    expect(messages).toEqual([{ role: 'user', content: 'Previous msg' }]);
  });

  it('should map system role entries', async () => {
    const { toMessageList } = await import('./convert-history');

    const body = createMockBridgeRequest({
      message: null,
      history: [
        { role: 'system', type: 'message', content: 'You are a wine bot', createdAt: '2025-01-01T00:00:00Z' },
        { role: 'subscriber', type: 'message', content: 'Hello', createdAt: '2025-01-01T00:00:01Z' },
      ],
    });
    const ctx = new AgentContextImpl(body, 'test-secret');

    const messages = toMessageList(ctx);

    expect(messages).toEqual([
      { role: 'system', content: 'You are a wine bot' },
      { role: 'user', content: 'Hello' },
    ]);
  });
});
