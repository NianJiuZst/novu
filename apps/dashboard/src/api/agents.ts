import type { IEnvironment } from '@novu/shared';
import { del, get, patch, post } from './api.client';

export type AgentDto = {
  _id?: string;
  name: string;
  identifier: string;
  _environmentId: string;
  _organizationId: string;
  integrationIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAgentBody = {
  name: string;
  identifier?: string;
};

export type UpdateAgentBody = {
  name?: string;
  identifier?: string;
  integrationIds?: string[];
};

export async function getAgents({ environment }: { environment: IEnvironment }): Promise<AgentDto[]> {
  const { data } = await get<{ data: AgentDto[] }>('/agents', { environment });

  return data;
}

export async function getAgent({
  agentId,
  environment,
}: {
  agentId: string;
  environment: IEnvironment;
}): Promise<AgentDto> {
  const { data } = await get<{ data: AgentDto }>(`/agents/${encodeURIComponent(agentId)}`, { environment });

  return data;
}

export async function createAgent({
  environment,
  body,
}: {
  environment: IEnvironment;
  body: CreateAgentBody;
}): Promise<AgentDto> {
  const { data } = await post<{ data: AgentDto }>('/agents', { environment, body });

  return data;
}

export async function updateAgent({
  agentId,
  environment,
  body,
}: {
  agentId: string;
  environment: IEnvironment;
  body: UpdateAgentBody;
}): Promise<AgentDto> {
  const { data } = await patch<{ data: AgentDto }>(`/agents/${encodeURIComponent(agentId)}`, {
    environment,
    body,
  });

  return data;
}

export async function deleteAgent({
  agentId,
  environment,
}: {
  agentId: string;
  environment: IEnvironment;
}): Promise<{ acknowledged: boolean; status: string }> {
  const { data } = await del<{ data: { acknowledged: boolean; status: string } }>(
    `/agents/${encodeURIComponent(agentId)}`,
    { environment }
  );

  return data;
}
