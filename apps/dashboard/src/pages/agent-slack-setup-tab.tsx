import type { AgentDto } from '@/api/agents';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/primitives/accordion';
import { CodeBlock } from '@/components/primitives/code-block';
import { CopyButton } from '@/components/primitives/copy-button';
import { Input } from '@/components/primitives/input';
import { Skeleton } from '@/components/primitives/skeleton';
import { API_HOSTNAME } from '@/config';

function normalizeApiBase(hostname: string | undefined): string {
  if (!hostname) {
    return '';
  }

  return hostname.replace(/\/+$/, '');
}

function yamlQuotedName(name: string): string {
  const safe = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  return `"${safe}"`;
}

function buildSlackManifest(webhookUrl: string, agentName: string): string {
  const quoted = yamlQuotedName(agentName);

  return `display_information:
  name: ${quoted}
  description: Novu Agent

features:
  bot_user:
    display_name: ${quoted}
    always_online: true

oauth_config:
  scopes:
    bot:
      - app_mentions:read
      - channels:history
      - channels:read
      - chat:write
      - groups:history
      - groups:read
      - im:history
      - im:read
      - mpim:history
      - mpim:read
      - reactions:read
      - reactions:write
      - users:read

settings:
  event_subscriptions:
    request_url: ${webhookUrl}
    bot_events:
      - app_mention
      - message.channels
      - message.groups
      - message.im
      - message.mpim
  interactivity:
    is_enabled: true
    request_url: ${webhookUrl}
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false`;
}

type AgentSlackSetupTabPanelProps = {
  agent: AgentDto | undefined;
  isAgentLoading: boolean;
};

export function AgentSlackSetupTabPanel(props: AgentSlackSetupTabPanelProps) {
  const { agent, isAgentLoading } = props;

  if (isAgentLoading || !agent) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const base = normalizeApiBase(API_HOSTNAME);
  const agentId = agent._id ?? '';
  const webhookUrl = base && agentId ? `${base}/v1/agents/${agentId}/slack` : '';
  const manifest = webhookUrl ? buildSlackManifest(webhookUrl, agent.name) : '';

  function renderWebhookUrlControl() {
    if (!base) {
      return (
        <p className="text-destructive text-sm">
          API hostname is not configured (VITE_API_HOSTNAME). Set it so the webhook URL can be shown.
        </p>
      );
    }

    if (!agentId) {
      return <p className="text-destructive text-sm">This agent has no ID yet.</p>;
    }

    return (
      <div className="flex max-w-2xl items-center gap-2">
        <Input readOnly value={webhookUrl} className="font-code text-sm" />
        <CopyButton valueToCopy={webhookUrl} size="xs" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <span className="text-foreground-400 text-xs font-medium uppercase tracking-wider">Webhook URL</span>
        <p className="text-foreground-600 max-w-[70ch] text-sm">
          Point your Slack app’s Event Subscriptions and Interactivity URLs at this endpoint. It receives Slack events
          for this agent.
        </p>
      </div>

      {renderWebhookUrlControl()}

      <Accordion type="multiple" defaultValue={['step-1', 'step-2']} className="flex flex-col gap-2">
        <AccordionItem value="step-1">
          <AccordionTrigger className="text-foreground-950 px-2 font-medium">
            Step 1: Create a Slack app
          </AccordionTrigger>
          <AccordionContent className="text-foreground-600 space-y-3 px-2 pb-2">
            <p>
              Open{' '}
              <a
                href="https://api.slack.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                api.slack.com/apps
              </a>{' '}
              and choose <strong>Create New App</strong> → <strong>From an app manifest</strong>. Pick your workspace
              and paste the manifest from the next step.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-2">
          <AccordionTrigger className="text-foreground-950 px-2 font-medium">
            Step 2: Copy the app manifest
          </AccordionTrigger>
          <AccordionContent className="space-y-3 px-2 pb-2">
            <p className="text-foreground-600 text-sm">
              This YAML includes your webhook URL for event subscriptions and interactivity. Paste it into Slack’s
              manifest editor.
            </p>
            {manifest ? (
              <CodeBlock code={manifest} language="shell" title="slack-app-manifest.yaml" />
            ) : (
              <p className="text-foreground-500 text-sm">Configure the API hostname and ensure the agent has an ID.</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-3">
          <AccordionTrigger className="text-foreground-950 px-2 font-medium">Step 3: Get credentials</AccordionTrigger>
          <AccordionContent className="text-foreground-600 space-y-3 px-2 pb-2">
            <p>
              In your Slack app, open <strong>OAuth &amp; Permissions</strong> and copy the{' '}
              <strong>Bot User OAuth Token</strong>. Open <strong>Basic Information</strong> →{' '}
              <strong>App Credentials</strong> and copy the <strong>Signing Secret</strong>.
            </p>
            <p>
              Set these as environment variables on the <strong>Novu API</strong> server (not the dashboard build):
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                <code className="font-code bg-neutral-alpha-100 rounded px-1 py-0.5">SLACK_BOT_TOKEN</code> — Bot User
                OAuth Token
              </li>
              <li>
                <code className="font-code bg-neutral-alpha-100 rounded px-1 py-0.5">SLACK_SIGNING_SECRET</code> —
                Signing Secret
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-4">
          <AccordionTrigger className="text-foreground-950 px-2 font-medium">
            Step 4: Install to workspace
          </AccordionTrigger>
          <AccordionContent className="text-foreground-600 space-y-3 px-2 pb-2">
            <p>
              Use <strong>Install to Workspace</strong> in Slack. Invite the bot to a channel with{' '}
              <code className="font-code bg-neutral-alpha-100 rounded px-1 py-0.5">/invite @YourBotName</code>.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-5">
          <AccordionTrigger className="text-foreground-950 px-2 font-medium">Step 5: Test</AccordionTrigger>
          <AccordionContent className="text-foreground-600 space-y-3 px-2 pb-2">
            <p>
              In the channel, mention the bot (e.g.{' '}
              <code className="font-code bg-neutral-alpha-100 rounded px-1 py-0.5">@YourBotName hello</code>
              ). When everything is wired correctly, it should reply with <strong>PONG</strong>.
            </p>
            <p className="text-sm">
              See also the{' '}
              <a
                href="https://chat-sdk.dev/docs/guides/slack-nextjs#create-a-slack-app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Chat SDK Slack guide
              </a>{' '}
              for more context on Slack app setup.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
