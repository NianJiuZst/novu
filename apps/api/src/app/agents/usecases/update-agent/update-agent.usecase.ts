import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AgentRepository, IntegrationRepository } from '@novu/dal';
import { GetAgent } from '../get-agent/get-agent.usecase';
import { UpdateAgentCommand } from './update-agent.command';

@Injectable()
export class UpdateAgent {
  constructor(
    private agentRepository: AgentRepository,
    private integrationRepository: IntegrationRepository,
    private getAgent: GetAgent
  ) {}

  async execute(command: UpdateAgentCommand) {
    const hasName = command.name !== undefined && command.name.trim().length > 0;
    const hasIdentifier = command.identifier !== undefined && command.identifier.trim().length > 0;
    const hasIntegrationIds = command.integrationIds !== undefined;

    if (!hasName && !hasIdentifier && !hasIntegrationIds) {
      throw new BadRequestException('At least one of name, identifier, or integrationIds must be provided');
    }

    const existing = await this.getAgent.execute({
      environmentId: command.environmentId,
      organizationId: command.organizationId,
      userId: command.userId,
      agentId: command.agentId,
    });

    const nextName = hasName ? (command.name?.trim() ?? existing.name) : existing.name;
    const nextIdentifier = hasIdentifier ? (command.identifier?.trim() ?? existing.identifier) : existing.identifier;

    if (hasIdentifier && nextIdentifier !== existing.identifier) {
      const duplicate = await this.agentRepository.findOne(
        {
          _environmentId: command.environmentId,
          identifier: nextIdentifier,
        },
        ['_id']
      );

      if (duplicate && duplicate._id !== existing._id) {
        throw new ConflictException(`Agent with identifier "${nextIdentifier}" already exists`);
      }
    }

    let normalizedIntegrationIds: string[] | undefined;

    if (hasIntegrationIds) {
      normalizedIntegrationIds = [...new Set(command.integrationIds ?? [])];

      if (normalizedIntegrationIds.length > 0) {
        const found = await this.integrationRepository.find(
          {
            _environmentId: command.environmentId,
            _id: { $in: normalizedIntegrationIds },
          },
          '_id'
        );

        if (found.length !== normalizedIntegrationIds.length) {
          throw new NotFoundException('One or more integrations were not found in this environment');
        }
      }
    }

    const $set: Record<string, unknown> = {};

    if (hasName) {
      $set.name = nextName;
    }

    if (hasIdentifier) {
      $set.identifier = nextIdentifier;
    }

    if (normalizedIntegrationIds !== undefined) {
      $set.integrationIds = normalizedIntegrationIds;
    }

    const result = await this.agentRepository.update(
      {
        _id: existing._id,
        _environmentId: existing._environmentId,
      },
      { $set }
    );

    if (result.matched === 0) {
      throw new NotFoundException();
    }

    return this.getAgent.execute({
      environmentId: command.environmentId,
      organizationId: command.organizationId,
      userId: command.userId,
      agentId: command.agentId,
    });
  }
}
