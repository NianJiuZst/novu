import { Injectable } from '@nestjs/common';
import { AgentEntity, AgentRepository } from '@novu/dal';
import { ListAgentsCommand } from './list-agents.command';

@Injectable()
export class ListAgents {
  constructor(private agentRepository: AgentRepository) {}

  async execute(command: ListAgentsCommand): Promise<AgentEntity[]> {
    return this.agentRepository.find({ _environmentId: command.environmentId }, '*', { sort: { createdAt: -1 } });
  }
}
