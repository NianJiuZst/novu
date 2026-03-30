import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentEntity, AgentRepository } from '@novu/dal';
import { GetAgentCommand } from './get-agent.command';

@Injectable()
export class GetAgent {
  constructor(private agentRepository: AgentRepository) {}

  async execute(command: GetAgentCommand): Promise<AgentEntity> {
    const result = await this.agentRepository.findOne(
      {
        _environmentId: command.environmentId,
        _id: command.agentId,
      },
      '*'
    );

    if (result === null) {
      throw new NotFoundException();
    }

    return result;
  }
}
