import { Novu } from '@novu/api';

export function getNovuSecretKey(): string {
  const secretKey = process.env.NOVU_SECRET_KEY;

  if (!secretKey) {
    throw new Error('NOVU_SECRET_KEY is required');
  }

  return secretKey;
}

/**
 * Root URL of the Novu API host (no `/v1`). The `@novu/api` client adds versioned paths per operation
 * (e.g. `/v1/channel-endpoints`, `/v2/subscribers`).
 */
function normalizeNovuApiRootFromEnv(): string | undefined {
  const raw = process.env.NOVU_API_BASE_URL;

  if (!raw) {
    return undefined;
  }

  return raw.replace(/\/v1$/, '');
}

export function getNovuServerUrl(): string {
  const root = normalizeNovuApiRootFromEnv();

  if (root) {
    return root;
  }

  return 'https://api.novu.co';
}

/**
 * Server-side Novu client (see https://docs.novu.co/platform/integrations/chat/slack#generate-the-oauth-url).
 */
export function createNovuApiClient(overrides?: { secretKey?: string; serverURL?: string }): Novu {
  const secretKey = overrides?.secretKey ?? getNovuSecretKey();
  const serverURL = overrides?.serverURL ?? getNovuServerUrl();

  const client = new Novu({
    secretKey,
    serverURL,
  });

  return client;
}

type NovuConversationMessageRole = 'user' | 'assistant' | 'system';

function novuApiHeaders(secretKey: string): HeadersInit {
  return {
    Authorization: `ApiKey ${secretKey}`,
    'Content-Type': 'application/json',
  };
}

function normalizeApiRoot(serverURL: string): string {
  return serverURL.replace(/\/$/, '');
}

export async function createOrGetNovuConversation(params: {
  serverURL: string;
  secretKey: string;
  subscriberId: string;
  agentId: string;
  platform: string;
  platformThreadId: string;
  title?: string;
}): Promise<{ id: string }> {
  const url = `${normalizeApiRoot(params.serverURL)}/v1/conversations`;
  const res = await fetch(url, {
    method: 'POST',
    headers: novuApiHeaders(params.secretKey),
    body: JSON.stringify({
      subscriberId: params.subscriberId,
      agentId: params.agentId,
      platform: params.platform,
      platformThreadId: params.platformThreadId,
      title: params.title,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Novu POST /v1/conversations failed: ${res.status} ${text}`);
  }

  const body = (await res.json()) as { id: string };

  return body;
}

export async function appendNovuConversationMessage(params: {
  serverURL: string;
  secretKey: string;
  conversationId: string;
  role: NovuConversationMessageRole;
  content: string;
  senderName?: string;
  platform?: string;
  platformMessageId?: string;
}): Promise<void> {
  const url = `${normalizeApiRoot(params.serverURL)}/v1/conversations/${encodeURIComponent(params.conversationId)}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: novuApiHeaders(params.secretKey),
    body: JSON.stringify({
      role: params.role,
      content: params.content,
      senderName: params.senderName,
      platform: params.platform,
      platformMessageId: params.platformMessageId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Novu POST conversation message failed: ${res.status} ${text}`);
  }
}

export async function updateNovuConversationStatus(params: {
  serverURL: string;
  secretKey: string;
  conversationId: string;
  status: 'active' | 'resolved' | 'abandoned';
}): Promise<void> {
  const url = `${normalizeApiRoot(params.serverURL)}/v1/conversations/${encodeURIComponent(params.conversationId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: novuApiHeaders(params.secretKey),
    body: JSON.stringify({ status: params.status }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Novu PATCH conversation failed: ${res.status} ${text}`);
  }
}
