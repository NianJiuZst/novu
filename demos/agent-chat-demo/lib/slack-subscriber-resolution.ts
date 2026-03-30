import type { Novu } from '@novu/api';
import { ProvidersIdEnum } from '@novu/api/models/components';
import { createNovuApiClient } from './novu-server-api';

const SLACK_USER_TYPE = 'slack_user' as const;

const MAX_PAGES = 25;

export type SlackSubscriberResolutionOptions = {
  integrationIdentifier: string;
  /**
   * When true and no `slack_user` endpoint exists yet, if the environment has exactly one
   * Slack channel connection with a subscriberId, use that subscriberId for any Slack user.
   */
  singleSlackConnectionFallback?: boolean;
};

function getSlackUserIdFromEndpoint(row: {
  type: string;
  endpoint: { userId?: string } | Record<string, unknown>;
}): string | undefined {
  if (row.type !== SLACK_USER_TYPE) {
    return undefined;
  }

  const ep = row.endpoint as { userId?: string };

  return typeof ep.userId === 'string' ? ep.userId : undefined;
}

export async function findSubscriberIdBySlackUserEndpoint(
  slackUserId: string,
  integrationIdentifier: string
): Promise<string | undefined> {
  const novu = createNovuApiClient();
  let after: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    console.log('listing channel endpoints', integrationIdentifier, ProvidersIdEnum.Slack, 100, after);
    const { result } = await novu.channelEndpoints.list({
      integrationIdentifier,
      providerId: ProvidersIdEnum.Slack,
      limit: 100,
      after,
    });

    for (const row of result.data) {
      const uid = getSlackUserIdFromEndpoint(row);

      if (uid === slackUserId && row.subscriberId) {
        return row.subscriberId;
      }
    }

    if (!result.next) {
      break;
    }

    after = result.next ?? undefined;
  }

  return undefined;
}

async function uniqueSubscriberIdsFromSlackConnections(integrationIdentifier: string): Promise<string[]> {
  const novu = createNovuApiClient();
  const ids = new Set<string>();
  let after: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { result } = await novu.channelConnections.list({
      integrationIdentifier,
      providerId: 'slack',
      limit: 100,
      after,
    });

    for (const row of result.data) {
      if (row.subscriberId) {
        ids.add(row.subscriberId);
      }
    }

    if (!result.next) {
      break;
    }

    after = result.next ?? undefined;
  }

  return [...ids];
}

async function subscriberHasSlackUserEndpoint(
  novu: Novu,
  subscriberId: string,
  slackUserId: string,
  integrationIdentifier: string
): Promise<boolean> {
  const { result } = await novu.channelEndpoints.list({
    subscriberId,
    integrationIdentifier,
    providerId: 'slack',
    limit: 100,
  });

  return result.data.some((row) => {
    const uid = getSlackUserIdFromEndpoint(row);

    return uid === slackUserId && row.subscriberId === subscriberId;
  });
}

export async function ensureSlackUserLinked(
  novu: Novu,
  subscriberId: string,
  slackUserId: string,
  slackUserName: string,
  integrationIdentifier: string
): Promise<void> {
  const hasEndpoint = await subscriberHasSlackUserEndpoint(novu, subscriberId, slackUserId, integrationIdentifier);

  try {
    await novu.subscribers.patch(
      {
        data: {
          slackUserId,
          slackUserName,
        },
      },
      subscriberId
    );
  } catch (err) {
    console.error('[novu] subscribers.patch failed:', err);
  }

  if (hasEndpoint) {
    return;
  }

  try {
    await novu.channelEndpoints.create({
      subscriberId,
      integrationIdentifier,
      type: SLACK_USER_TYPE,
      endpoint: { userId: slackUserId },
    });
    console.log(`[novu] created slack_user channel endpoint for subscriber=${subscriberId} slackUser=${slackUserId}`);
  } catch (err) {
    console.error('[novu] channelEndpoints.create (slack_user) failed:', err);
  }
}

export function createSlackSubscriberResolver(options: SlackSubscriberResolutionOptions) {
  const cache = new Map<string, string>();
  const { integrationIdentifier, singleSlackConnectionFallback = true } = options;

  return async function resolveSlackSubscriberId(slackUserId: string): Promise<string> {
    const cached = cache.get(slackUserId);

    if (cached) {
      return cached;
    }

    const fromEndpoint = await findSubscriberIdBySlackUserEndpoint(slackUserId, integrationIdentifier);

    if (fromEndpoint) {
      cache.set(slackUserId, fromEndpoint);

      return fromEndpoint;
    }

    if (singleSlackConnectionFallback) {
      const uniqueIds = await uniqueSubscriberIdsFromSlackConnections(integrationIdentifier);

      if (uniqueIds.length === 1) {
        const id = uniqueIds[0];
        cache.set(slackUserId, id);

        return id;
      }
    }

    return slackUserId;
  };
}
