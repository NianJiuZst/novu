import { Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentUsecase, shortId } from '@novu/application-generic';
import {
  ChannelEndpointEntity,
  ChannelEndpointRepository,
  CommunityOrganizationRepository,
  EnvironmentEntity,
  EnvironmentRepository,
  IntegrationEntity,
  IntegrationRepository,
  OrganizationEntity,
  SubscriberEntity,
  SubscriberRepository,
} from '@novu/dal';
import { ProvidersIdEnum } from '@novu/shared';
import { GetChannelEndpointResponseDto } from '../../dtos/get-channel-endpoint-response.dto';
import { UpsertChannelEndpointCommand } from './upsert-channel-endpoint.command';

@Injectable()
export class UpsertChannelEndpoint {
  constructor(
    private readonly channelEndpointRepository: ChannelEndpointRepository,
    private readonly organizationRepository: CommunityOrganizationRepository,
    private readonly environmentRepository: EnvironmentRepository,
    private readonly integrationRepository: IntegrationRepository,
    private readonly subscriberRepository: SubscriberRepository
  ) {}

  @InstrumentUsecase()
  async execute(command: UpsertChannelEndpointCommand): Promise<GetChannelEndpointResponseDto> {
    const { organization, environment, integration, subscriber } = await this.validateEntitiesExists(command);

    const identifier = command.identifier || this.generateIdentifier(integration.identifier, subscriber.subscriberId);

    const channelEndpoint = await this.upsertChannelEndpoint(command, {
      identifier,
      integration,
      subscriber,
      organization,
      environment,
    });

    return this.mapChannelEndpointEntityToDto(channelEndpoint, integration);
  }

  private async upsertChannelEndpoint(
    command: UpsertChannelEndpointCommand,
    entities: {
      identifier: string;
      integration: IntegrationEntity;
      subscriber: SubscriberEntity;
      organization: OrganizationEntity;
      environment: EnvironmentEntity;
    }
  ): Promise<ChannelEndpointEntity> {
    const baseFields = {
      identifier: entities.identifier,
      _integrationId: entities.integration._id,
      _organizationId: entities.organization._id,
      _environmentId: entities.environment._id,
    };

    const channelEndpoint = await this.channelEndpointRepository.findOneAndUpdate(
      baseFields,
      {
        ...baseFields,
        subscriberId: entities.subscriber.subscriberId,
        endpoint: command.endpoint,
        routing: command.routing,
      },
      {
        upsert: true,
        new: true,
      }
    );

    if (!channelEndpoint) {
      throw new NotFoundException('Failed to create or update channel endpoint');
    }

    return channelEndpoint;
  }

  private mapChannelEndpointEntityToDto(
    channelEndpoint: ChannelEndpointEntity,
    integration: IntegrationEntity
  ): GetChannelEndpointResponseDto {
    return {
      identifier: channelEndpoint.identifier,
      channel: integration.channel,
      provider: integration.providerId as ProvidersIdEnum,
      endpoint: channelEndpoint.endpoint,
      routing: channelEndpoint.routing,
      createdAt: channelEndpoint.createdAt,
      updatedAt: channelEndpoint.updatedAt,
    };
  }

  private async validateEntitiesExists(command: UpsertChannelEndpointCommand) {
    const [organization, environment, integration, subscriber] = await Promise.all([
      this.organizationRepository.findOne({ _id: command.organizationId }),
      this.environmentRepository.findOne({ _id: command.environmentId }),
      this.integrationRepository.findOne({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        identifier: command.integrationIdentifier,
      }),
      this.subscriberRepository.findOne({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        subscriberId: command.subscriberId,
      }),
    ]);

    if (!organization) {
      throw new NotFoundException(`Organization not found: ${command.organizationId}`);
    }

    if (!environment) {
      throw new NotFoundException(`Environment not found: ${command.environmentId}`);
    }

    if (!integration) {
      throw new NotFoundException(`Integration not found: ${command.integrationIdentifier}`);
    }

    if (!subscriber) {
      throw new NotFoundException(`Subscriber not found: ${command.subscriberId}`);
    }

    return { organization, environment, integration, subscriber };
  }

  private generateIdentifier(integrationIdentifier: string, subscriberId: string): string {
    return `${integrationIdentifier}-${subscriberId}-${shortId(4)}`;
  }
}
