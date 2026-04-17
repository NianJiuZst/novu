import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '@novu/application-generic';
import { AgentIntegrationRepository, AgentRepository } from '@novu/dal';

import { AgentAnalyticsEventsEnum } from '../../utils/analytics';
import { DeleteAgentCommand } from './delete-agent.command';

@Injectable()
export class DeleteAgent {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly agentIntegrationRepository: AgentIntegrationRepository,
    private readonly analyticsService: AnalyticsService
  ) {}

  async execute(command: DeleteAgentCommand): Promise<void> {
    const agent = await this.agentRepository.findOne(
      {
        identifier: command.identifier,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      ['_id']
    );

    if (!agent) {
      throw new NotFoundException(`Agent with identifier "${command.identifier}" was not found.`);
    }

    const linkedIntegrationsCount = await this.agentIntegrationRepository.count({
      _agentId: agent._id,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    await this.agentIntegrationRepository.delete({
      _agentId: agent._id,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    await this.agentRepository.delete({
      _id: agent._id,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    this.analyticsService.track(AgentAnalyticsEventsEnum.AGENT_DELETED, command.userId, {
      _agent: agent._id,
      agentIdentifier: command.identifier,
      linkedIntegrationsCount,
      _environment: command.environmentId,
      _organization: command.organizationId,
    });
  }
}
