import { ConnectChat, LinkUser, NovuProvider } from '@novu/nextjs';
import Title from '@/components/Title';
import { novuConfig } from '@/utils/config';

const INTEGRATION_IDENTIFIER = process.env.NEXT_PUBLIC_NOVU_SLACK_INTEGRATION_IDENTIFIER ?? 'slack';
const CONNECTION_IDENTIFIER = 'slack-workspace-connection';
const SLACK_USER_ID = process.env.NEXT_PUBLIC_SLACK_USER_ID ?? 'U12345678';

export default function ConnectChatPage() {
  return (
    <>
      <Title title="Connect Chat Components" />
      <div className="flex flex-col gap-8 p-4 max-w-xl">
        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">ConnectChat — Connect Slack workspace via OAuth</h4>
          <p className="text-xs text-muted-foreground">
            Clicking &quot;Connect&quot; opens the Slack OAuth flow in a new window. The workspace token is stored as a{' '}
            <code>ChannelConnection</code>.
          </p>
          <NovuProvider {...novuConfig}>
            <ConnectChat
              integrationIdentifier={INTEGRATION_IDENTIFIER}
              connectionIdentifier={CONNECTION_IDENTIFIER}
              onConnectSuccess={(id) => console.log('connect success, identifier:', id)}
              onConnectError={(err) => console.error('connect error:', err)}
              onDisconnectSuccess={() => console.log('disconnect success')}
              onDisconnectError={(err) => console.error('disconnect error:', err)}
            />
          </NovuProvider>
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">LinkUser — Link subscriber to a Slack user ID</h4>
          <p className="text-xs text-muted-foreground">
            Creates a <code>ChannelEndpoint</code> of type <code>slack_user</code> linking the subscriber to a Slack
            user. Requires an active workspace connection.
          </p>
          <NovuProvider {...novuConfig}>
            <LinkUser
              integrationIdentifier={INTEGRATION_IDENTIFIER}
              connectionIdentifier={CONNECTION_IDENTIFIER}
              subscriberId={novuConfig.subscriberId}
              slackUserId={SLACK_USER_ID}
              onLinkSuccess={(ep) => console.log('link success, endpoint:', ep.identifier)}
              onLinkError={(err) => console.error('link error:', err)}
              onUnlinkSuccess={() => console.log('unlink success')}
              onUnlinkError={(err) => console.error('unlink error:', err)}
            />
          </NovuProvider>
        </section>
      </div>
    </>
  );
}
