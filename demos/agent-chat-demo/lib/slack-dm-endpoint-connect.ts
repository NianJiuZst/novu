import { ProvidersIdEnum } from '@novu/api/models/components';

import { createNovuApiClient } from './novu-server-api';

const SLACK_LOOKUP_BY_EMAIL_URL = 'https://slack.com/api/users.lookupByEmail';
const SLACK_USER_TYPE = 'slack_user' as const;

export type EnsureSlackUserDmEndpointResult = {
  ok: boolean;
  slackUserId?: string;
  error?: string;
};

function slackUserIdFromEndpointRow(row: {
  type: string;
  endpoint: { userId?: string } | Record<string, unknown>;
}): string | undefined {
  if (row.type !== SLACK_USER_TYPE) {
    return undefined;
  }

  const ep = row.endpoint as { userId?: string };

  return typeof ep.userId === 'string' ? ep.userId : undefined;
}

export async function lookupSlackUserIdByEmail(botAccessToken: string, email: string): Promise<string | undefined> {
  try {
    const res = await fetch(SLACK_LOOKUP_BY_EMAIL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botAccessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ email: email.trim().toLowerCase() }),
    });

    const data = (await res.json()) as { ok?: boolean; user?: { id?: string } };

    if (data?.ok !== true || !data?.user?.id) {
      return undefined;
    }

    return data.user.id;
  } catch {
    return undefined;
  }
}

/**
 * After Novu Slack workspace OAuth, create a slack_user channel endpoint so DMs route to this subscriber.
 * Requires the workspace Bot User OAuth Token (xoxb-…) — same app Novu uses — plus an email that matches the
 * Slack account (see Novu Slack docs: users.lookupByEmail).
 */
export async function ensureSlackUserDmEndpointAfterConnect(args: {
  subscriberId: string;
  integrationIdentifier: string;
  /** Workspace bot token (xoxb-…). Prefer env SLACK_BOT_USER_OAUTH_TOKEN. */
  slackBotToken?: string;
  /** If set, used instead of the subscriber profile email from Novu. */
  emailOverride?: string;
  /** If set, skips Slack API lookup. */
  slackUserIdOverride?: string;
}): Promise<EnsureSlackUserDmEndpointResult> {
  const novu = createNovuApiClient();
  const { subscriberId, integrationIdentifier } = args;

  let slackUserId = args.slackUserIdOverride?.trim();

  if (!slackUserId) {
    const subRes = await novu.subscribers.retrieve(subscriberId);
    const profileEmail =
      args.emailOverride?.trim() || (typeof subRes.result?.email === 'string' ? subRes.result.email.trim() : '');

    const botToken = (args.slackBotToken || process.env.SLACK_BOT_USER_OAUTH_TOKEN || '').trim();

    if (!profileEmail) {
      return {
        ok: false,
        error: 'Subscriber has no email. Pass email when creating the subscriber or emailOverride in this request.',
      };
    }

    if (!botToken) {
      return {
        ok: false,
        error:
          'Missing workspace bot token. Set SLACK_BOT_USER_OAUTH_TOKEN (Bot User OAuth Token from Slack after install) or pass slackBotToken.',
      };
    }

    slackUserId = await lookupSlackUserIdByEmail(botToken, profileEmail);

    if (!slackUserId) {
      return {
        ok: false,
        error:
          'Could not resolve Slack user id (users.lookupByEmail). Use an email that matches your Slack account, or pass slackUserIdOverride.',
      };
    }
  }

  const connections = await novu.channelConnections.list({
    subscriberId,
    integrationIdentifier,
    providerId: 'slack',
    limit: 100,
  });

  console.log('connections', connections);
  const connectionIdentifier = connections.result.data.find((c) => c.identifier)?.identifier;

  if (!connectionIdentifier) {
    return {
      ok: false,
      error: 'No Slack channel connection for this subscriber. Complete Connect Slack (Novu OAuth) first.',
    };
  }

  const endpoints = await novu.channelEndpoints.list({
    subscriberId,
    integrationIdentifier,
    providerId: 'slack',
    limit: 100,
  });

  const alreadyLinked = endpoints.result.data.some((row) => {
    const uid = slackUserIdFromEndpointRow(row);

    return uid === slackUserId && row.subscriberId === subscriberId;
  });

  if (alreadyLinked) {
    return { ok: true, slackUserId };
  }

  try {
    await novu.channelEndpoints.create({
      subscriberId,
      integrationIdentifier,
      connectionIdentifier,
      type: SLACK_USER_TYPE,
      endpoint: { userId: slackUserId },
    });

    return { ok: true, slackUserId };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'channelEndpoints.create failed';

    return { ok: false, error: message };
  }
}
