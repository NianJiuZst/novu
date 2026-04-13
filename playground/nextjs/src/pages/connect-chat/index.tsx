import { ConnectChat, LinkUser, NovuProvider } from '@novu/nextjs';
import { Info } from 'lucide-react';
import { useState } from 'react';
import Title from '@/components/Title';
import { novuConfig } from '@/utils/config';

const INTEGRATION_IDENTIFIER = process.env.NEXT_PUBLIC_NOVU_SLACK_INTEGRATION_IDENTIFIER ?? 'slack';
const CONNECTION_IDENTIFIER = 'slack-workspace-connection';
const SLACK_USER_ID_DEFAULT = 'C03FDHMURU0';
const SLACK_TEST_WORKFLOW_ID = process.env.NEXT_PUBLIC_NOVU_SLACK_TEST_WORKFLOW_ID ?? '';

export default function ConnectChatPage() {
  const [slackUserIdInput, setSlackUserIdInput] = useState('');
  const slackUserIdForLink =
    slackUserIdInput.trim() || (process.env.NEXT_PUBLIC_SLACK_USER_ID?.trim() ?? '') || SLACK_USER_ID_DEFAULT;

  const [dmStatus, setDmStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dmLoading, setDmLoading] = useState(false);
  const [triggerWorkflowId, setTriggerWorkflowId] = useState(SLACK_TEST_WORKFLOW_ID);
  const [triggerStatus, setTriggerStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [triggerLoading, setTriggerLoading] = useState(false);

  const handleCreateDmEndpoint = async () => {
    setDmLoading(true);
    setDmStatus(null);

    try {
      const res = await fetch('/api/slack-dm-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: novuConfig.subscriberId,
          integrationIdentifier: INTEGRATION_IDENTIFIER,
        }),
      });

      const data = (await res.json()) as { slackUserId?: string; error?: string };

      if (!res.ok || data.error) {
        setDmStatus({ type: 'error', message: data.error ?? 'Unknown error' });
      } else {
        setDmStatus({ type: 'success', message: `DM endpoint created for Slack user: ${data.slackUserId}` });
      }
    } catch (err) {
      setDmStatus({ type: 'error', message: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setDmLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!triggerWorkflowId.trim()) {
      setTriggerStatus({ type: 'error', message: 'Workflow ID is required' });

      return;
    }

    setTriggerLoading(true);
    setTriggerStatus(null);

    try {
      const res = await fetch('/api/trigger-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: triggerWorkflowId.trim(),
          to: { subscriberId: novuConfig.subscriberId },
          payload: { message: 'Test message from connect-chat playground' },
        }),
      });

      const data = (await res.json()) as { data?: { transactionId?: string }; error?: string; message?: string };

      if (!res.ok) {
        setTriggerStatus({ type: 'error', message: data.message ?? data.error ?? `HTTP ${res.status}` });
      } else {
        const txId = data.data?.transactionId ?? '—';

        setTriggerStatus({ type: 'success', message: `Triggered ✓  transactionId: ${txId}` });
      }
    } catch (err) {
      setTriggerStatus({ type: 'error', message: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <>
      <Title title="Connect Chat Components" />
      <div className="flex flex-col gap-8 p-4 max-w-xl">
        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">Step 1 — ConnectChat: OAuth with endpoint configuration</h4>
          <p className="text-xs text-muted-foreground">
            Same Slack user ID as the section above. With <code>endpointType</code> and <code>endpointData</code>, OAuth
            also creates the <code>ChannelEndpoint</code> — the Step 2 Link User flow is optional in that case.
          </p>
          <NovuProvider {...novuConfig}>
            <ConnectChat
              integrationIdentifier={INTEGRATION_IDENTIFIER}
              connectionIdentifier={CONNECTION_IDENTIFIER}
              // endpointType="slack_user"
              // endpointData={{ userId: slackUserIdForLink }}
              onConnectSuccess={(id) => console.log('connect success, identifier:', id)}
              onConnectError={(err) => console.error('connect error:', err)}
              onDisconnectSuccess={() => console.log('disconnect success')}
              onDisconnectError={(err) => console.error('disconnect error:', err)}
            />
          </NovuProvider>
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">Step 2 — LinkUser: Link subscriber to a Slack user ID</h4>
          <p className="text-xs text-muted-foreground">
            Creates a <code>ChannelEndpoint</code> of type <code>slack_user</code> linking the subscriber to a Slack
            user. Requires an active workspace connection from Step 1.
          </p>
          <NovuProvider {...novuConfig}>
            <LinkUser
              integrationIdentifier={INTEGRATION_IDENTIFIER}
              connectionIdentifier={CONNECTION_IDENTIFIER}
              subscriberId={novuConfig.subscriberId}
              type="slack_user"
              endpoint={{ userId: slackUserIdForLink }}
              onLinkSuccess={(ep) => console.log('link success, endpoint:', ep.identifier)}
              onLinkError={(err) => console.error('link error:', err)}
              onUnlinkSuccess={() => console.log('unlink success')}
              onUnlinkError={(err) => console.error('unlink error:', err)}
            />
          </NovuProvider>
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">Server-side DM Endpoint — Resolve email to Slack user ID</h4>
          <p className="text-xs text-muted-foreground">
            Calls <code>/api/slack-dm-endpoint</code> which looks up the subscriber email via the Slack bot token (
            <code>SLACK_BOT_USER_OAUTH_TOKEN</code>) and registers a <code>slack_user</code>{' '}
            <code>ChannelEndpoint</code>. Requires the subscriber to have completed OAuth via <em>ConnectChat</em>{' '}
            first.
          </p>
          <button
            onClick={handleCreateDmEndpoint}
            disabled={dmLoading}
            className="self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {dmLoading ? 'Creating…' : 'Create DM Endpoint'}
          </button>
          {dmStatus && (
            <p className={`text-xs ${dmStatus.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
              {dmStatus.message}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">
            Send Test Message — Trigger a workflow via <code>/v1/events/trigger</code>
          </h4>
          <p className="text-xs text-muted-foreground">
            Calls the Novu trigger engine directly to dispatch a workflow to the current subscriber. Use this to verify
            the full e2e path: OAuth → endpoint registration → message delivery.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={triggerWorkflowId}
              onChange={(e) => setTriggerWorkflowId(e.target.value)}
              placeholder="workflow-id (e.g. slack-dm-test)"
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleSendTestMessage}
              disabled={triggerLoading || !triggerWorkflowId.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {triggerLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Subscriber: <code>{novuConfig.subscriberId}</code>
          </p>
          {triggerStatus && (
            <p className={`text-xs ${triggerStatus.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
              {triggerStatus.message}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
