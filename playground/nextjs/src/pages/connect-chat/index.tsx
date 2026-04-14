import { NovuProvider, SlackConnectButton, SlackLinkUser } from '@novu/nextjs';
import { useState } from 'react';
import Title from '@/components/Title';
import { novuConfig } from '@/utils/config';

const INTEGRATION_IDENTIFIER = process.env.NEXT_PUBLIC_NOVU_SLACK_INTEGRATION_IDENTIFIER ?? 'slack';
const CONNECTION_IDENTIFIER = 'slack-workspace-connection';
const SLACK_TEST_WORKFLOW_ID = process.env.NEXT_PUBLIC_NOVU_SLACK_TEST_WORKFLOW_ID ?? '';
// const context = { key: 'value1' };
const context = undefined;

export default function ConnectChatPage() {
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
          ...(context && { context: context }),
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
          <h4 className="text-sm font-semibold">Step 1 — SlackConnectButton: OAuth with endpoint configuration</h4>
          <p className="text-xs text-muted-foreground">
            With <code>endpointType</code> and <code>endpointData</code>, OAuth also creates the{' '}
            <code>ChannelEndpoint</code> — the Step 2 Link User flow is optional in that case.
          </p>
          <NovuProvider {...novuConfig}>
            <SlackConnectButton
              integrationIdentifier={INTEGRATION_IDENTIFIER}
              connectLabel="Connect to Slack AAA"
              connectedLabel="Connected to Slack AAA"
              // connectionIdentifier={CONNECTION_IDENTIFIER}
              // connectionStrategy: 'subscriber' | 'shared' DEFAULT 'subscriber'

              // in NovuProvider
              // subscriberId: string // redundant
              // ...(context && { context: context }),
            />
          </NovuProvider>
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">Step 2 — SlackLinkUser: Link subscriber via Slack OAuth</h4>
          <p className="text-xs text-muted-foreground">
            Starts a Slack OAuth flow (<code>user_scope=identity.basic</code>) to automatically resolve the
            subscriber&apos;s Slack user ID and create a <code>ChannelEndpoint</code> of type <code>slack_user</code>.
            Requires an active workspace connection from Step 1.
          </p>
          <NovuProvider {...novuConfig}>
            <SlackLinkUser
              integrationIdentifier={INTEGRATION_IDENTIFIER}
              // connectionIdentifier={CONNECTION_IDENTIFIER}
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
