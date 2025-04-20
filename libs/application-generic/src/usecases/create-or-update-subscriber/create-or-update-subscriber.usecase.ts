import { Injectable } from '@nestjs/common';
import { EnvironmentRepository, SubscriberEntity, SubscriberRepository } from '@novu/dal';
import { PostActionEnum } from '@novu/framework/internal';
import { WorkflowOriginEnum } from '@novu/shared';
import { RetryOnError } from '../../decorators/retry-on-error-decorator';
import { AnalyticsService, buildSubscriberKey, InvalidateCacheService } from '../../services';
import { ExecuteBridgeRequest } from '../execute-bridge-request';
import { OAuthHandlerEnum, UpdateSubscriberChannel, UpdateSubscriberChannelCommand } from '../subscribers';
import { UpdateSubscriber, UpdateSubscriberCommand } from '../update-subscriber';
import { CreateOrUpdateSubscriberCommand } from './create-or-update-subscriber.command';

@Injectable()
export class CreateOrUpdateSubscriberUseCase {
  constructor(
    private invalidateCache: InvalidateCacheService,
    private subscriberRepository: SubscriberRepository,
    private updateSubscriberUseCase: UpdateSubscriber,
    private updateSubscriberChannel: UpdateSubscriberChannel,
    private analyticsService: AnalyticsService,
    private environmentRepository: EnvironmentRepository,
    private executeBridgeRequest: ExecuteBridgeRequest,
  ) {}

  @RetryOnError('MongoServerError', {
    maxRetries: 3,
    delay: 500,
  })
  async execute(command: CreateOrUpdateSubscriberCommand) {
    const environment = await this.environmentRepository.findOne({
      _id: command.environmentId,
    }, 'disableSubscriberPersistence _id');
    const persistedSubscriber = await this.getExistingSubscriber(command);

    if (persistedSubscriber) {
      await this.updateSubscriber(command, persistedSubscriber, environment?.disableSubscriberPersistence);
    } else {
      await this.createSubscriber(command, environment?.disableSubscriberPersistence);
    }

    if (command.channels?.length) {
      await this.updateCredentials(command);
    }

    return await this.fetchSubscriber({
      _environmentId: command.environmentId,
      subscriberId: command.subscriberId,
      disableSubscriberPersistence: environment.disableSubscriberPersistence,
    });
  }

  private async updateSubscriber(command: CreateOrUpdateSubscriberCommand, existingSubscriber: SubscriberEntity, disableSubscriberPersistence: boolean) {
    return await this.updateSubscriberUseCase.execute(this.buildUpdateSubscriberCommand(command, existingSubscriber, disableSubscriberPersistence));
  }

  private async getExistingSubscriber(command: CreateOrUpdateSubscriberCommand) {
    const existingSubscriber: SubscriberEntity =
      command.subscriber ??
      (await this.fetchSubscriber({
        _environmentId: command.environmentId,
        subscriberId: command.subscriberId,
        disableSubscriberPersistence: false
      }));

    return existingSubscriber;
  }

  private publishSubscriberCreatedEvent(command: CreateOrUpdateSubscriberCommand) {
    this.analyticsService.mixpanelTrack('Subscriber Created', '', {
      _organization: command.organizationId,
      hasEmail: !!command.email,
      hasPhone: !!command.phone,
      hasAvatar: !!command.avatar,
      hasLocale: !!command.locale,
      hasData: !!command.data,
      hasCredentials: !!command.channels,
    });
  }

  private buildUpdateSubscriberCommand(command: CreateOrUpdateSubscriberCommand, subscriber: SubscriberEntity, disableSubscriberPersistence: boolean) {
    if (disableSubscriberPersistence) {
      return UpdateSubscriberCommand.create({
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        subscriberId: command.subscriberId,
        subscriber,
      });
    }

    return UpdateSubscriberCommand.create({
      environmentId: command.environmentId,
      organizationId: command.organizationId,
      firstName: command.firstName,
      lastName: command.lastName,
      subscriberId: command.subscriberId,
      email: command.email,
      phone: command.phone,
      avatar: command.avatar,
      locale: command.locale,
      data: command.data,
      subscriber,
      channels: command.channels,
      timezone: command.timezone,
    });
  }

  private async updateCredentials(command: CreateOrUpdateSubscriberCommand) {
    for (const channel of command.channels) {
      await this.updateSubscriberChannel.execute(
        UpdateSubscriberChannelCommand.create({
          organizationId: command.organizationId,
          environmentId: command.environmentId,
          subscriberId: command.subscriberId,
          providerId: channel.providerId,
          credentials: channel.credentials,
          integrationIdentifier: channel.integrationIdentifier,
          oauthHandler: OAuthHandlerEnum.EXTERNAL,
          isIdempotentOperation: false,
        })
      );
    }
  }

  private async createSubscriber(command: CreateOrUpdateSubscriberCommand, disableSubscriberPersistence: boolean): Promise<SubscriberEntity> {
    await this.invalidateCache.invalidateByKey({
      key: buildSubscriberKey({
        subscriberId: command.subscriberId,
        _environmentId: command.environmentId,
      }),
    });

    let subscriberData: Partial<SubscriberEntity> & { _environmentId: string; _organizationId: string; } = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      subscriberId: command.subscriberId,
    };

    if (!disableSubscriberPersistence) {
      subscriberData = {
        ...subscriberData,
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
        phone: command.phone,
        avatar: command.avatar,
        locale: command.locale,
        data: command.data,
        timezone: command.timezone,
      };
    }

    const createdSubscriber = await this.subscriberRepository.create(subscriberData);
    this.publishSubscriberCreatedEvent(command);

    return createdSubscriber;
  }

  private async fetchSubscriber({
    subscriberId,
    _environmentId,
    disableSubscriberPersistence,
  }: {
    subscriberId: string;
    _environmentId: string;
    disableSubscriberPersistence: boolean;
  }): Promise<SubscriberEntity | null> {


    let dbSubscriber = await this.subscriberRepository.findBySubscriberId(_environmentId, subscriberId, false);
    if (!dbSubscriber) {
      return null;
    }

    if (disableSubscriberPersistence) {
      const resolvedSubscriber = await this.resolveSubscriberDetails(_environmentId, subscriberId);

      if (resolvedSubscriber) {
        dbSubscriber = {
          ...dbSubscriber,
          ...resolvedSubscriber,
        }
      }
    }

    return dbSubscriber;
  }


  private async resolveSubscriberDetails(environmentId: string, subscriberId: string): Promise<SubscriberEntity | null> {
    try {
      const environment = await this.environmentRepository.findOne(
        {
          _id: environmentId,
        },
        'bridge apiKeys _id'
      );

      if (!environment || !environment?.bridge?.url) {
        return null;
      }

      if (!subscriberId) {
        return null;
      }

      // Since we need to send the entities in the body, we need to use the PostActionEnum.TRIGGER
      // and pass our own body with the entities to resolve
      const response = await this.executeBridgeRequest.execute({
        environmentId: environmentId,
        workflowOrigin: WorkflowOriginEnum.NOVU_CLOUD,
        statelessBridgeUrl: environment?.bridge?.url,
        event: {
          entities: [
            {
              type: 'subscriber',
              id: subscriberId,
            },
          ],
        } as any,
        action: PostActionEnum.RESOLVE,
        searchParams: {
          action: 'resolve',
        } as any,
        processError: async (error) => {
          // Log the error but don't fail the job
          console.error(`Error resolving subscriber: ${error.message}`);
        },
      });

      // Cast to any because we know the response structure
      const responseData = response as any;

      // Return the subscriber data if found
      if (responseData?.subscriber) {
        return responseData.subscriber;
      }

      return null;
    } catch (error) {
      console.error('Failed to resolve subscriber details:', error);

      return null;
    }
  }
}
