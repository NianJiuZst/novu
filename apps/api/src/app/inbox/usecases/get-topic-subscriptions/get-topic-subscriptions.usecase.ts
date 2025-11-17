import { Injectable } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import {
  NotificationTemplateRepository,
  PreferencesRepository,
  TopicSubscribersEntity,
  TopicSubscribersRepository,
} from '@novu/dal';
import { PreferencesTypeEnum } from '@novu/shared';
import { TopicSubscriptionDetailsDto } from '../../dtos/get-topic-subscriptions-response.dto';
import { mapTopicSubscriptionToDto } from '../../utils/topic-subscription-mapper';
import { GetTopicSubscriptionsCommand } from './get-topic-subscriptions.command';

@Injectable()
export class GetTopicSubscriptions {
  constructor(
    private topicSubscribersRepository: TopicSubscribersRepository,
    private preferencesRepository: PreferencesRepository,
    private notificationTemplateRepository: NotificationTemplateRepository
  ) {}

  @InstrumentUsecase()
  async execute(command: GetTopicSubscriptionsCommand): Promise<TopicSubscriptionDetailsDto[]> {
    const subscriptions = await this.topicSubscribersRepository.find({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      topicKey: command.topicKey,
    });

    return await this.buildSubscriptionsResponse(subscriptions);
  }

  private async buildSubscriptionsResponse(
    subscriptions: TopicSubscribersEntity[]
  ): Promise<TopicSubscriptionDetailsDto[]> {
    const result: TopicSubscriptionDetailsDto[] = [];

    for (const subscription of subscriptions) {
      const preferencesEntities = await this.preferencesRepository.find({
        _environmentId: subscription._environmentId,
        _organizationId: subscription._organizationId,
        _topicSubscriptionId: subscription._id,
        _subscriberId: subscription._subscriberId,
        type: PreferencesTypeEnum.SUBSCRIPTION_SUBSCRIBER_WORKFLOW,
      });

      const workflowIds = preferencesEntities
        .map((pref) => pref._templateId?.toString())
        .filter((id): id is string => id !== undefined);

      const workflows =
        workflowIds.length > 0
          ? await this.notificationTemplateRepository.find({
              _id: { $in: workflowIds },
              _environmentId: subscription._environmentId,
              _organizationId: subscription._organizationId,
            })
          : [];

      result.push(mapTopicSubscriptionToDto(subscription, preferencesEntities, workflows));
    }

    return result;
  }
}
