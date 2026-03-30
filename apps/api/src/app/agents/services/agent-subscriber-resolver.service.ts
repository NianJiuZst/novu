import { Injectable } from '@nestjs/common';
import { PinoLogger, UpdateSubscriber, UpdateSubscriberCommand } from '@novu/application-generic';
import { ChannelEndpointEntity } from '@novu/dal';
import { ChatProviderIdEnum, DirectionEnum, ENDPOINT_TYPES } from '@novu/shared';
import { ListChannelConnectionsCommand } from '../../channel-connections/usecases/list-channel-connections/list-channel-connections.command';
import { ListChannelConnections } from '../../channel-connections/usecases/list-channel-connections/list-channel-connections.usecase';
import { CreateChannelEndpointCommand } from '../../channel-endpoints/usecases/create-channel-endpoint/create-channel-endpoint.command';
import { CreateChannelEndpoint } from '../../channel-endpoints/usecases/create-channel-endpoint/create-channel-endpoint.usecase';
import { ListChannelEndpointsCommand } from '../../channel-endpoints/usecases/list-channel-endpoints/list-channel-endpoints.command';
import { ListChannelEndpoints } from '../../channel-endpoints/usecases/list-channel-endpoints/list-channel-endpoints.usecase';
import { buildAgentWebhookUserSession } from '../utils/agent-webhook-user-session';

const SLACK_USER_TYPE = ENDPOINT_TYPES.SLACK_USER;

const MAX_PAGES = 25;

function getSlackUserIdFromEndpoint(row: ChannelEndpointEntity): string | undefined {
  if (row.type !== SLACK_USER_TYPE) {
    return undefined;
  }

  const ep = row.endpoint as { userId?: string };

  return typeof ep.userId === 'string' ? ep.userId : undefined;
}

@Injectable()
export class AgentSubscriberResolverService {
  private readonly resolveCache = new Map<string, string>();

  constructor(
    private readonly listChannelEndpoints: ListChannelEndpoints,
    private readonly createChannelEndpoint: CreateChannelEndpoint,
    private readonly listChannelConnections: ListChannelConnections,
    private readonly updateSubscriber: UpdateSubscriber,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(AgentSubscriberResolverService.name);
  }

  async resolveSlackSubscriberId(params: {
    organizationId: string;
    environmentId: string;
    slackUserId: string;
    integrationIdentifier: string;
    singleSlackConnectionFallback?: boolean;
  }): Promise<string> {
    const {
      organizationId,
      environmentId,
      slackUserId,
      integrationIdentifier,
      singleSlackConnectionFallback = true,
    } = params;

    const cacheKey = `${environmentId}::${integrationIdentifier}::${slackUserId}`;
    const cached = this.resolveCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const user = buildAgentWebhookUserSession(organizationId, environmentId);
    const fromEndpoint = await this.findSubscriberIdBySlackUserEndpoint({
      user,
      slackUserId,
      integrationIdentifier,
    });

    if (fromEndpoint) {
      this.resolveCache.set(cacheKey, fromEndpoint);

      return fromEndpoint;
    }

    if (singleSlackConnectionFallback) {
      const uniqueIds = await this.uniqueSubscriberIdsFromSlackConnections({
        user,
        integrationIdentifier,
      });

      if (uniqueIds.length === 1) {
        const id = uniqueIds[0];
        this.resolveCache.set(cacheKey, id);

        return id;
      }
    }

    return slackUserId;
  }

  async ensureSlackUserLinked(params: {
    organizationId: string;
    environmentId: string;
    subscriberId: string;
    slackUserId: string;
    slackUserName: string;
    integrationIdentifier: string;
  }): Promise<void> {
    const { organizationId, environmentId, subscriberId, slackUserId, slackUserName, integrationIdentifier } = params;

    const user = buildAgentWebhookUserSession(organizationId, environmentId);
    const hasEndpoint = await this.subscriberHasSlackUserEndpoint({
      user,
      subscriberId,
      slackUserId,
      integrationIdentifier,
    });

    try {
      await this.updateSubscriber.execute(
        UpdateSubscriberCommand.create({
          environmentId,
          organizationId,
          subscriberId,
          data: {
            slackUserId,
            slackUserName,
          },
        })
      );
    } catch (err) {
      this.logger.error({ err }, '[agent-webhook] subscribers update failed');
    }

    if (hasEndpoint) {
      return;
    }

    try {
      await this.createChannelEndpoint.execute(
        CreateChannelEndpointCommand.create({
          organizationId,
          environmentId,
          subscriberId,
          integrationIdentifier,
          type: ENDPOINT_TYPES.SLACK_USER,
          endpoint: { userId: slackUserId },
        })
      );
    } catch (err) {
      this.logger.error({ err }, '[agent-webhook] channelEndpoints.create (slack_user) failed');
    }
  }

  private async findSubscriberIdBySlackUserEndpoint(params: {
    user: ReturnType<typeof buildAgentWebhookUserSession>;
    slackUserId: string;
    integrationIdentifier: string;
  }): Promise<string | undefined> {
    const { user, slackUserId, integrationIdentifier } = params;
    let after: string | undefined;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await this.listChannelEndpoints.execute(
        ListChannelEndpointsCommand.create({
          user,
          limit: 100,
          after,
          orderBy: 'createdAt',
          orderDirection: DirectionEnum.DESC,
          integrationIdentifier,
          providerId: ChatProviderIdEnum.Slack,
        })
      );

      for (const row of result.data) {
        const uid = getSlackUserIdFromEndpoint(row);

        if (uid === slackUserId && row.subscriberId) {
          return row.subscriberId;
        }
      }

      if (!result.next) {
        break;
      }

      after = result.next ?? undefined;
    }

    return undefined;
  }

  private async uniqueSubscriberIdsFromSlackConnections(params: {
    user: ReturnType<typeof buildAgentWebhookUserSession>;
    integrationIdentifier: string;
  }): Promise<string[]> {
    const { user, integrationIdentifier } = params;
    const ids = new Set<string>();
    let after: string | undefined;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await this.listChannelConnections.execute(
        ListChannelConnectionsCommand.create({
          user,
          limit: 100,
          after,
          orderBy: 'createdAt',
          orderDirection: DirectionEnum.DESC,
          integrationIdentifier,
          providerId: ChatProviderIdEnum.Slack,
        })
      );

      for (const row of result.data) {
        if (row.subscriberId) {
          ids.add(row.subscriberId);
        }
      }

      if (!result.next) {
        break;
      }

      after = result.next ?? undefined;
    }

    return [...ids];
  }

  private async subscriberHasSlackUserEndpoint(params: {
    user: ReturnType<typeof buildAgentWebhookUserSession>;
    subscriberId: string;
    slackUserId: string;
    integrationIdentifier: string;
  }): Promise<boolean> {
    const { user, subscriberId, slackUserId, integrationIdentifier } = params;

    const result = await this.listChannelEndpoints.execute(
      ListChannelEndpointsCommand.create({
        user,
        limit: 100,
        orderBy: 'createdAt',
        orderDirection: DirectionEnum.DESC,
        subscriberId,
        integrationIdentifier,
        providerId: ChatProviderIdEnum.Slack,
      })
    );

    return result.data.some((row) => {
      const uid = getSlackUserIdFromEndpoint(row);

      return uid === slackUserId && row.subscriberId === subscriberId;
    });
  }
}
