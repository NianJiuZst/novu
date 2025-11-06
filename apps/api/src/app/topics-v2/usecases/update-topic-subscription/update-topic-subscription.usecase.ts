import { Injectable, NotFoundException } from '@nestjs/common';
import { generateConditionHash, InstrumentUsecase } from '@novu/application-generic';
import {
  CheckboxRule,
  ConditionType,
  CustomRule,
  Filter,
  NotificationTemplateRepository,
  SubscriberEntity,
  SubscriberRepository,
  TopicEntity,
  TopicRepository,
  TopicSubscriberRule,
  TopicSubscribersEntity,
  TopicSubscribersRepository,
} from '@novu/dal';
import { AdditionalOperation, RulesLogic } from 'json-logic-js';
import { TopicSubscriberRuleDto } from '../../dtos/create-topic-subscriptions.dto';
import { SubscriptionDto } from '../../dtos/create-topic-subscriptions-response.dto';
import { UpdateTopicSubscriptionCommand } from './update-topic-subscription.command';

@Injectable()
export class UpdateTopicSubscriptionUsecase {
  constructor(
    private topicRepository: TopicRepository,
    private topicSubscribersRepository: TopicSubscribersRepository,
    private subscriberRepository: SubscriberRepository,
    private notificationTemplateRepository: NotificationTemplateRepository
  ) {}

  @InstrumentUsecase()
  async execute(command: UpdateTopicSubscriptionCommand): Promise<SubscriptionDto> {
    const topic = await this.topicRepository.findTopicByKey(
      command.topicKey,
      command.organizationId,
      command.environmentId
    );

    if (!topic) {
      throw new NotFoundException(`Topic with key ${command.topicKey} not found`);
    }

    const subscription = await this.topicSubscribersRepository.findOne({
      _id: command.subscriptionId,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _topicId: topic._id,
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${command.subscriptionId} not found for topic ${command.topicKey}`
      );
    }

    const updateData: Partial<TopicSubscribersEntity> = {};

    if (command.rules !== undefined) {
      const ruleEntity = this.mapRulesFromDtoToEntity(command.rules);
      const rulesHash = generateConditionHash(ruleEntity);

      updateData.rules = ruleEntity;
      updateData.rulesHash = rulesHash;
    }

    if (command.name !== undefined) {
      updateData.name = command.name;
    }

    if (Object.keys(updateData).length === 0) {
      const subscriber = await this.subscriberRepository.findOne({
        _id: subscription._subscriberId,
        _environmentId: command.environmentId,
      });

      return this.mapSubscriptionToDto(subscription, subscriber, topic);
    }

    await this.topicSubscribersRepository.update(
      {
        _id: command.subscriptionId,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      updateData
    );

    const updatedSubscription = await this.topicSubscribersRepository.findOne({
      _id: command.subscriptionId,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    if (!updatedSubscription) {
      throw new NotFoundException(`Subscription with ID ${command.subscriptionId} could not be retrieved after update`);
    }

    const subscriber = await this.subscriberRepository.findOne({
      _id: updatedSubscription._subscriberId,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    return this.mapSubscriptionToDto(updatedSubscription, subscriber, topic);
  }

  private mapRulesFromDtoToEntity(rules?: TopicSubscriberRuleDto[]): TopicSubscriberRule[] | undefined {
    if (!rules) {
      return undefined;
    }

    return rules.map((rule) => {
      const filter: Filter = {
        workflows: rule.filter.workflows ?? [],
        tags: rule.filter.tags ?? [],
      };

      const condition = rule.condition === undefined ? true : rule.condition;

      if (typeof condition === 'boolean') {
        return {
          filter,
          condition,
          type: ConditionType.CHECKBOX,
        } satisfies CheckboxRule;
      }

      return {
        filter,
        condition: condition as RulesLogic<AdditionalOperation>,
        type: ConditionType.CUSTOM,
      } satisfies CustomRule;
    });
  }

  private mapSubscriptionToDto(
    subscription: TopicSubscribersEntity,
    subscriber: SubscriberEntity | null,
    topic: TopicEntity
  ): SubscriptionDto {
    return {
      _id: subscription._id,
      topic: {
        _id: topic._id,
        key: topic.key,
        name: topic.name,
      },
      subscriber: subscriber
        ? {
            _id: subscriber._id,
            subscriberId: subscriber.subscriberId,
            avatar: subscriber.avatar,
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
            email: subscriber.email,
          }
        : null,
      rules: subscription.rules,
      createdAt: subscription.createdAt ?? '',
      updatedAt: subscription.updatedAt ?? '',
    };
  }
}
