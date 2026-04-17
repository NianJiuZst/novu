import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '@novu/application-generic';
import { AgentIntegrationRepository, AgentRepository, IntegrationRepository } from '@novu/dal';

import { toAgentIntegrationResponse } from '../../mappers/agent-response.mapper';
import type { AgentIntegrationResponseDto } from '../../dtos';
import { AgentAnalyticsEventsEnum } from '../../utils/analytics';
import { AddAgentIntegrationCommand } from './add-agent-integration.command';

@Injectable()
export class AddAgentIntegration {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly integrationRepository: IntegrationRepository,
    private readonly agentIntegrationRepository: AgentIntegrationRepository,
    private readonly analyticsService: AnalyticsService
  ) {}

  async execute(command: AddAgentIntegrationCommand): Promise<AgentIntegrationResponseDto> {
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

    const integration = await this.integrationRepository.findOne(
      {
        identifier: command.integrationIdentifier,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      '_id identifier name providerId channel active'
    );

    if (!integration) {
      throw new NotFoundException(
        `Integration with identifier "${command.integrationIdentifier}" was not found.`
      );
    }

    const existingLink = await this.agentIntegrationRepository.findOne(
      {
        _agentId: agent._id,
        _integrationId: integration._id,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      ['_id']
    );

    if (existingLink) {
      throw new ConflictException('This integration is already linked to the agent.');
    }

    const link = await this.agentIntegrationRepository.create({
      _agentId: agent._id,
      _integrationId: integration._id,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    this.analyticsService.track(AgentAnalyticsEventsEnum.AGENT_INTEGRATION_ADDED, command.userId, {
      _agent: agent._id,
      _integration: integration._id,
      _agentIntegration: link._id,
      agentIdentifier: command.agentIdentifier,
      integrationIdentifier: integration.identifier,
      providerId: integration.providerId,
      channel: integration.channel,
      _environment: command.environmentId,
      _organization: command.organizationId,
    });

    return toAgentIntegrationResponse(link, integration);
  }
}
