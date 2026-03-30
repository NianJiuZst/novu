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
