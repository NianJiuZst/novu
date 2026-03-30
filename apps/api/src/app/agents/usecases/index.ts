import { CreateAgent } from './create-agent/create-agent.usecase';
import { DeleteAgent } from './delete-agent/delete-agent.usecase';
import { GetAgent } from './get-agent/get-agent.usecase';
import { ListAgents } from './list-agents/list-agents.usecase';
import { UpdateAgent } from './update-agent/update-agent.usecase';

export const USE_CASES = [ListAgents, CreateAgent, GetAgent, UpdateAgent, DeleteAgent];
