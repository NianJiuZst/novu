import { Injectable, NotFoundException } from '@nestjs/common';
import { EnvironmentEntity, EnvironmentRepository, SubscriberEntity, SubscriberRepository } from '@novu/dal';
import { PostActionEnum } from '@novu/framework/internal';
import { WorkflowOriginEnum } from '@novu/shared';
import { ExecuteBridgeRequest } from '../execute-bridge-request';
import { GetSubscriberCommand } from './get-subscriber.command';

@Injectable()
export class GetSubscriber {
  constructor(
    private subscriberRepository: SubscriberRepository,
    private environmentRepository: EnvironmentRepository,
    private executeBridgeRequest: ExecuteBridgeRequest
  ) {}

  async execute(command: GetSubscriberCommand): Promise<SubscriberEntity> {
    const environment =
      command.environment ??
      (await this.environmentRepository.findOne(
        {
          _id: command.environmentId,
        },
        'bridge apiKeys _id disableSubscriberPersistence'
      ));

    let subscriber = await this.fetchSubscriber({
      _environmentId: command.environmentId,
      subscriberId: command.subscriberId,
      _organizationId: command.organizationId,
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber: ${command.subscriberId} was not found`);
    }

    if (environment?.disableSubscriberPersistence && !command.skipSubscriberResolve) {
      const resolvedSubscriber = await this.resolveSubscriberDetails(environment, command.subscriberId);

      if (resolvedSubscriber) {
        subscriber = {
          ...subscriber,
          ...resolvedSubscriber,
        };
      }
    }

    return subscriber;
  }

  private async fetchSubscriber({
    subscriberId,
    _environmentId,
    _organizationId,
  }: {
    subscriberId: string;
    _environmentId: string;
    _organizationId: string;
  }): Promise<SubscriberEntity | null> {
    return await this.subscriberRepository.findOne({ _environmentId, subscriberId, _organizationId });
  }

  private async resolveSubscriberDetails(
    environment: EnvironmentEntity,
    subscriberId: string
  ): Promise<SubscriberEntity | null> {
    try {
      if (!environment || !environment?.bridge?.url) {
        return null;
      }

      if (!subscriberId) {
        return null;
      }

      /*
       * Since we need to send the entities in the body, we need to use the PostActionEnum.TRIGGER
       * and pass our own body with the entities to resolve
       */
      const response = await this.executeBridgeRequest.execute({
        environmentId: environment._id,
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
