import { ConflictException, Injectable } from '@nestjs/common';
import { AgentEntity, AgentRepository } from '@novu/dal';
import { slugify } from '@novu/shared';
import { CreateAgentCommand } from './create-agent.command';

@Injectable()
export class CreateAgent {
  constructor(private agentRepository: AgentRepository) {}

  async execute(command: CreateAgentCommand): Promise<AgentEntity> {
    const trimmedName = command.name.trim();

    if (!trimmedName) {
      throw new ConflictException('Agent name cannot be empty');
    }

    const baseIdentifier =
      (command.identifier?.trim() && command.identifier.trim()) || slugify(trimmedName, { lowercase: true });

    if (!baseIdentifier) {
      throw new ConflictException('Agent identifier cannot be empty');
    }

    const existing = await this.agentRepository.findOne(
      {
        _environmentId: command.environmentId,
        identifier: baseIdentifier,
      },
      ['_id']
    );

    if (existing) {
      throw new ConflictException(`Agent with identifier "${baseIdentifier}" already exists`);
    }

    return this.agentRepository.create({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      name: trimmedName,
      identifier: baseIdentifier,
    });
  }
}
