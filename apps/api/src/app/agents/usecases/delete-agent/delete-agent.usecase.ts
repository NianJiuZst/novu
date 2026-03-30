import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentRepository } from '@novu/dal';
import { DeleteAgentCommand } from './delete-agent.command';

@Injectable()
export class DeleteAgent {
  constructor(private agentRepository: AgentRepository) {}

  async execute(command: DeleteAgentCommand) {
    const deleted = await this.agentRepository.findOneAndDelete({
      _environmentId: command.environmentId,
      _id: command.agentId,
    });

    if (deleted === null) {
      throw new NotFoundException();
    }

    return {
      acknowledged: true,
      status: 'deleted',
    };
  }
}
