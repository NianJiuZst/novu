import { serveAgents } from '@/lib/agent';
import { wineAgent } from '@/lib/wine-agent';

const handler = serveAgents({
  agents: [wineAgent],
  slackIntegrationIdentifier: process.env.NOVU_SLACK_INTEGRATION_IDENTIFIER,
  singleSlackConnectionFallback: process.env.NOVU_DEMO_SINGLE_SLACK_CONNECTION_FALLBACK !== 'false',
});

export const GET = handler.GET;
export const POST = handler.POST;
