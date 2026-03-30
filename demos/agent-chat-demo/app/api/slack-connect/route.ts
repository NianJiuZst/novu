import { NextResponse } from 'next/server';

import { createNovuApiClient } from '@/lib/novu-server-api';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      subscriberId?: string;
      email?: string;
      integrationIdentifier?: string;
    };
    const subscriberId = typeof body.subscriberId === 'string' ? body.subscriberId.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';

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

    const novu = createNovuApiClient();

    await novu.subscribers.create({
      subscriberId,
      firstName: 'John',
      lastName: 'Doe',
      ...(email ? { email } : {}),
    });
    const oauth = await novu.integrations.generateChatOAuthUrl({
      integrationIdentifier,
      subscriberId,
    });

    return NextResponse.json({ url: oauth.result.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
