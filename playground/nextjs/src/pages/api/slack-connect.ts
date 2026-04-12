/**
 * POST /api/slack-connect
 *
 * Server-side companion for the `ConnectChat` SDK component.
 *
 * The SDK component handles the OAuth flow entirely client-side (subscriber JWT auth),
 * but some deployments need a server-side upsert of the subscriber first — e.g. when
 * the subscriber may not yet exist in Novu. This route shows that pattern.
 *
 * Required ENV vars:
 *   NOVU_SECRET_KEY                    Novu API secret (sk_...)
 *   NOVU_API_BASE_URL                  Optional Novu API base URL
 *   NOVU_SLACK_INTEGRATION_IDENTIFIER  Novu Slack integration identifier
 */

import { Novu } from '@novu/api';
import type { NextApiRequest, NextApiResponse } from 'next';

function getNovuClient(): Novu {
  const secretKey = process.env.NOVU_SECRET_KEY?.trim();

  if (!secretKey) throw new Error('NOVU_SECRET_KEY is required');

  const serverURL = (
    process.env.NOVU_API_BASE_URL ??
    process.env.NEXT_PUBLIC_NOVU_BACKEND_URL ??
    'https://api.novu.co'
  ).replace(/\/v1$/, '');

  return new Novu({ security: { secretKey }, serverURL });
}

type RequestBody = {
  subscriberId?: string;
  email?: string;
  integrationIdentifier?: string;
};

type ResponseData = { url: string } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });

    return;
  }

  try {
    const body = req.body as RequestBody;
    const subscriberId = typeof body.subscriberId === 'string' ? body.subscriberId.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!subscriberId) {
      res.status(400).json({ error: 'subscriberId is required' });

      return;
    }

    const integrationIdentifier =
      (typeof body.integrationIdentifier === 'string' && body.integrationIdentifier.trim()) ||
      process.env.NOVU_SLACK_INTEGRATION_IDENTIFIER;

    if (!integrationIdentifier) {
      res.status(400).json({ error: 'integrationIdentifier is required (body or NOVU_SLACK_INTEGRATION_IDENTIFIER)' });

      return;
    }

    const novu = getNovuClient();

    await novu.subscribers.create({
      subscriberId,
      ...(email ? { email } : {}),
    });

    const oauth = await novu.integrations.generateChatOAuthUrl({
      integrationIdentifier,
      subscriberId,
    });

    res.status(200).json({ url: oauth.result.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
