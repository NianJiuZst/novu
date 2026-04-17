import { AgentIntegrationGuideSection } from './agent-integration-guide-section';
import { AgentIntegrationGuideStep } from './agent-integration-guide-step';

type CloudflareAgentHostingGuideProps = {
  agentIdentifier: string;
};

const WORKER_SNIPPET = `import { AIChatAgent } from '@cloudflare/ai-chat';
import { routeAgentRequest } from 'agents';
import { withNovuAgent, createNovuRouter } from '@novu/framework/cloudflare';

export class MyAgent extends withNovuAgent(AIChatAgent)<Env> {
  static novuAgentId = '{{AGENT_ID}}';

  async onNovuMessage(ctx) {
    await ctx.reply('Hello from Cloudflare Workers!');
  }
}

export default {
  fetch: createNovuRouter({
    agents: { MyAgent },
    fallthrough: routeAgentRequest,
  }),
};`;

const WRANGLER_SNIPPET = `{
  "durable_objects": {
    "bindings": [{ "name": "MyAgent", "class_name": "MyAgent" }]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["MyAgent"] }
  ]
}`;

export function CloudflareAgentHostingGuide({ agentIdentifier }: CloudflareAgentHostingGuideProps) {
  const workerCode = WORKER_SNIPPET.replace('{{AGENT_ID}}', agentIdentifier);

  return (
    <div className="flex flex-col gap-4">
      <AgentIntegrationGuideSection title="Deploy on Cloudflare Workers">
        <p>
          Use <code className="font-code text-[12px]">@novu/framework/cloudflare</code> to run your agent as a
          Cloudflare Durable Object with built-in per-conversation state, scheduling, and multi-channel delivery through
          Novu.
        </p>
      </AgentIntegrationGuideSection>

      <div className="flex flex-col gap-3">
        <p className="text-text-strong text-label-sm font-medium">Steps</p>

        <AgentIntegrationGuideStep
          step={1}
          title="Install dependencies"
          description="npm install @novu/framework agents @cloudflare/ai-chat"
        />

        <AgentIntegrationGuideStep
          step={2}
          title="Create your Worker"
          description={
            <pre className="bg-bg-weak mt-1 overflow-x-auto rounded-md p-3 font-mono text-xs leading-relaxed">
              {workerCode}
            </pre>
          }
        />

        <AgentIntegrationGuideStep
          step={3}
          title="Add DO bindings to wrangler.jsonc"
          description={
            <pre className="bg-bg-weak mt-1 overflow-x-auto rounded-md p-3 font-mono text-xs leading-relaxed">
              {WRANGLER_SNIPPET}
            </pre>
          }
        />

        <AgentIntegrationGuideStep
          step={4}
          title="Set the Novu secret and deploy"
          description="wrangler secret put NOVU_SECRET_KEY && wrangler deploy"
        />

        <AgentIntegrationGuideStep
          step={5}
          title="Set the Bridge URL"
          description="In the Novu dashboard, paste your Worker URL (https://<worker>.workers.dev/) as the agent's Bridge URL."
        />
      </div>
    </div>
  );
}
