import { NextResponse } from 'next/server';

import { createNovuApiClient } from '@/lib/novu-server-api';
import { createSlackSubscriberResolver, ensureSlackUserLinked } from '@/lib/slack-subscriber-resolution';

/**
 * Resolves a Novu subscriberId for a Slack user id using `slack_user` channel endpoints
 * and (by default) the single-Slack-connection demo fallback.
 * Set `ensure: true` to upsert subscriber data and create a `slack_user` channel endpoint when missing.
 */
export async function POST(request: Request) {
  try {
    const integrationIdentifier = process.env.NOVU_SLACK_INTEGRATION_IDENTIFIER;

    if (!integrationIdentifier) {
      return NextResponse.json({ error: 'NOVU_SLACK_INTEGRATION_IDENTIFIER is not configured' }, { status: 500 });
    }

    const body = (await request.json()) as {
      slackUserId?: string;
      slackUserName?: string;
      ensure?: boolean;
    };

    const slackUserId = typeof body.slackUserId === 'string' ? body.slackUserId.trim() : '';

    if (!slackUserId) {
      return NextResponse.json({ error: 'slackUserId is required' }, { status: 400 });
    }

    const resolver = createSlackSubscriberResolver({
      integrationIdentifier,
      singleSlackConnectionFallback: process.env.NOVU_DEMO_SINGLE_SLACK_CONNECTION_FALLBACK !== 'false',
    });

    const subscriberId = await resolver(slackUserId);

    if (body.ensure) {
      const novu = createNovuApiClient();
      const slackUserName = typeof body.slackUserName === 'string' ? body.slackUserName : slackUserId;

      await ensureSlackUserLinked(novu, subscriberId, slackUserId, slackUserName, integrationIdentifier);
    }

    return NextResponse.json({ subscriberId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
