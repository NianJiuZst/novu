import { ConflictException, Injectable } from '@nestjs/common';
import { AnalyticsService } from '@novu/application-generic';
import { AgentRepository } from '@novu/dal';

import { toAgentResponse } from '../../mappers/agent-response.mapper';
import type { AgentResponseDto } from '../../dtos';
import { AgentAnalyticsEventsEnum } from '../../utils/analytics';
import { CreateAgentCommand } from './create-agent.command';

@Injectable()
export class CreateAgent {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly analyticsService: AnalyticsService
  ) {}

  async execute(command: CreateAgentCommand): Promise<AgentResponseDto> {
    const existing = await this.agentRepository.findOne(
      {
        identifier: command.identifier,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      ['_id']
    );

    if (existing) {
      throw new ConflictException(`An agent with identifier "${command.identifier}" already exists in this environment.`);
    }

    const agent = await this.agentRepository.create({
      name: command.name,
      identifier: command.identifier,
      description: command.description,
      active: command.active ?? true,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    this.analyticsService.track(AgentAnalyticsEventsEnum.AGENT_CREATED, command.userId, {
      _agent: agent._id,
      agentIdentifier: agent.identifier,
      active: agent.active,
      hasDescription: Boolean(agent.description),
      _environment: command.environmentId,
      _organization: command.organizationId,
    });

    return toAgentResponse(agent);
  }
}
