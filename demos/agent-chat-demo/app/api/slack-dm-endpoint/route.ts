import { NextResponse } from 'next/server';

import { ensureSlackUserDmEndpointAfterConnect } from '@/lib/slack-dm-endpoint-connect';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      subscriberId?: string;
      integrationIdentifier?: string;
      emailOverride?: string;
      slackUserIdOverride?: string;
      slackBotToken?: string;
    };

    const subscriberId = typeof body.subscriberId === 'string' ? body.subscriberId.trim() : '';

    if (!subscriberId) {
      return NextResponse.json({ error: 'subscriberId is required' }, { status: 400 });
    }

    const integrationIdentifier =
      (typeof body.integrationIdentifier === 'string' && body.integrationIdentifier.trim()) ||
      process.env.NOVU_SLACK_INTEGRATION_IDENTIFIER;

    if (!integrationIdentifier) {
      return NextResponse.json(
        { error: 'integrationIdentifier is required (body or NOVU_SLACK_INTEGRATION_IDENTIFIER)' },
        { status: 400 }
      );
    }

    const result = await ensureSlackUserDmEndpointAfterConnect({
      subscriberId,
      integrationIdentifier,
      emailOverride: typeof body.emailOverride === 'string' ? body.emailOverride : undefined,
      slackUserIdOverride: typeof body.slackUserIdOverride === 'string' ? body.slackUserIdOverride : undefined,
      slackBotToken: typeof body.slackBotToken === 'string' ? body.slackBotToken : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Failed' }, { status: 422 });
    }

    return NextResponse.json({ slackUserId: result.slackUserId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
