import { serveAgents } from '@/lib/agent';
import { wineAgent } from '@/lib/wine-agent';

export const POST = serveAgents({ agents: [wineAgent] });
