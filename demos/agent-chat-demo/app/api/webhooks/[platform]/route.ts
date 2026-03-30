import { serveAgents } from '@/lib/agent';
import { wineAgent } from '@/lib/wine-agent';

export const POST = serveAgents({
  agents: [wineAgent],
  slackIntegrationIdentifier: process.env.NOVU_SLACK_INTEGRATION_IDENTIFIER,
  singleSlackConnectionFallback: process.env.NOVU_DEMO_SINGLE_SLACK_CONNECTION_FALLBACK !== 'false',
});
