import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '@novu/application-generic';
import { AgentIntegrationRepository, AgentRepository, IntegrationRepository } from '@novu/dal';

import { AgentAnalyticsEventsEnum } from '../../utils/analytics';
import { RemoveAgentIntegrationCommand } from './remove-agent-integration.command';

@Injectable()
export class RemoveAgentIntegration {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly agentIntegrationRepository: AgentIntegrationRepository,
    private readonly integrationRepository: IntegrationRepository,
    private readonly analyticsService: AnalyticsService
  ) {}

  async execute(command: RemoveAgentIntegrationCommand): Promise<void> {
    const agent = await this.agentRepository.findOne(
      {
        identifier: command.agentIdentifier,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      ['_id']
    );

    if (!agent) {
      throw new NotFoundException(`Agent with identifier "${command.agentIdentifier}" was not found.`);
    }

    const deleted = await this.agentIntegrationRepository.findOneAndDelete({
      _id: command.agentIntegrationId,
      _agentId: agent._id,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    if (!deleted) {
      throw new NotFoundException(
        `Agent-integration link "${command.agentIntegrationId}" was not found for this agent.`
      );
    }

    const integration = await this.integrationRepository.findOne(
      {
        _id: deleted._integrationId,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      'identifier providerId channel'
    );

    this.analyticsService.track(AgentAnalyticsEventsEnum.AGENT_INTEGRATION_REMOVED, command.userId, {
      _agent: agent._id,
      _integration: deleted._integrationId,
      _agentIntegration: command.agentIntegrationId,
      agentIdentifier: command.agentIdentifier,
      integrationIdentifier: integration?.identifier,
      providerId: integration?.providerId,
      channel: integration?.channel,
      _environment: command.environmentId,
      _organization: command.organizationId,
    });
  }
}
