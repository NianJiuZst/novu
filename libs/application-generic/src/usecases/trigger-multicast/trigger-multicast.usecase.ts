import { BadRequestException, Injectable } from '@nestjs/common';
import {
  isSubscriptionCheckboxRule,
  isSubscriptionCustomRule,
  NotificationTemplateRepository,
  TopicEntity,
  TopicRepository,
  type TopicSubscriberRule,
  TopicSubscribersRepository,
} from '@novu/dal';
import {
  ISubscribersDefine,
  ITopic,
  SubscriberSourceEnum,
  TriggerRecipient,
  TriggerRecipientSubscriber,
  TriggerRecipientsTypeEnum,
} from '@novu/shared';
import jsonLogic from 'json-logic-js';
import { PinoLogger } from '../..';
import { InstrumentUsecase } from '../../instrumentation';
import { CacheService, FeatureFlagsService } from '../../services';
import type { EventType, Trace } from '../../services/analytic-logs';
import { LogRepository, mapEventTypeToTitle, TraceLogRepository } from '../../services/analytic-logs';
import { SubscriberProcessQueueService } from '../../services/queues/subscriber-process-queue.service';
import { TriggerBase } from '../trigger-base';
import { TriggerMulticastCommand } from './trigger-multicast.command';

const QUEUE_CHUNK_SIZE = Number(process.env.MULTICAST_QUEUE_CHUNK_SIZE) || 100;
const SUBSCRIBER_TOPIC_DISTINCT_BATCH_SIZE = Number(process.env.SUBSCRIBER_TOPIC_DISTINCT_BATCH_SIZE) || 100;

const isTopic = (recipient: TriggerRecipient): recipient is ITopic =>
  (recipient as ITopic).type && (recipient as ITopic).type === TriggerRecipientsTypeEnum.TOPIC;

@Injectable()
export class TriggerMulticast extends TriggerBase {
  constructor(
    subscriberProcessQueueService: SubscriberProcessQueueService,
    private topicSubscribersRepository: TopicSubscribersRepository,
    private topicRepository: TopicRepository,
    private notificationTemplateRepository: NotificationTemplateRepository,
    protected cacheService: CacheService,
    protected featureFlagsService: FeatureFlagsService,
    protected logger: PinoLogger,
    private traceLogRepository: TraceLogRepository
  ) {
    super(subscriberProcessQueueService, cacheService, featureFlagsService, logger, QUEUE_CHUNK_SIZE);
    this.logger.setContext(this.constructor.name);
  }

  @InstrumentUsecase()
  async execute(command: TriggerMulticastCommand) {
    const { environmentId, organizationId, to: recipients, actor } = command;

    try {
      const mappedRecipients = Array.isArray(recipients) ? recipients : [recipients];

      const { singleSubscribers, topicKeys, topicExclusions } = splitByRecipientType(mappedRecipients);
      const subscribersToProcess = Array.from(singleSubscribers.values());
      let totalProcessed = 0;

      if (subscribersToProcess.length > 0) {
        await this.sendToProcessSubscriberService(command, subscribersToProcess, SubscriberSourceEnum.SINGLE);
        totalProcessed += subscribersToProcess.length;
      }

      const topics = await this.getTopicsByTopicKeys(organizationId, environmentId, topicKeys);

      await this.validateTopicExist(command, topics, topicKeys);

      const topicIds = topics.map((topic) => topic._id);
      const singleSubscriberIds = Array.from(singleSubscribers.keys());
      const allTopicExcludedSubscribers = Array.from(
        new Set([...Array.from(topicExclusions.values()).flatMap((set) => Array.from(set))])
      );
      let totalSubscriptionsEvaluated = 0;
      let totalSubscriptionsFiltered = 0;

      const getTopicSubscriptionsGenerator = this.topicSubscribersRepository.getTopicSubscriptionsWithRules({
        query: {
          _organizationId: organizationId,
          _environmentId: environmentId,
          topicIds,
          excludeSubscribers: [...singleSubscriberIds, ...allTopicExcludedSubscribers],
        },
        batchSize: SUBSCRIBER_TOPIC_DISTINCT_BATCH_SIZE,
      });

      const subscribersMap = new Map<string, { subscriberId: string; topics: Pick<TopicEntity, '_id' | 'key'>[] }>();

      for await (const subscriptionsBatch of getTopicSubscriptionsGenerator) {
        totalSubscriptionsEvaluated += subscriptionsBatch.length;

        const passingSubscriptions = await Promise.all(
          subscriptionsBatch.map(async (subscription, index) => {
            const passes = await this.evaluateSubscriptionRules(
              subscription.rules,
              command.payload,
              command.template._id,
              command.environmentId,
              command.organizationId
            );

            return { subscription, passes };
          })
        );

        const filteredPassingSubscriptions = passingSubscriptions
          .filter(({ passes }) => passes)
          .map(({ subscription }) => subscription);

        totalSubscriptionsFiltered += subscriptionsBatch.length - filteredPassingSubscriptions.length;

        for (const subscription of filteredPassingSubscriptions) {
          const externalSubscriberId = subscription.externalSubscriberId;

          if (actor && actor.subscriberId === externalSubscriberId) {
            continue;
          }

          if (!subscribersMap.has(externalSubscriberId)) {
            subscribersMap.set(externalSubscriberId, {
              subscriberId: externalSubscriberId,
              topics: topics?.map((topic) => ({ _id: topic._id, key: topic.key })),
            });
          }
        }

        if (subscribersMap.size >= SUBSCRIBER_TOPIC_DISTINCT_BATCH_SIZE) {
          const batchToProcess = Array.from(subscribersMap.values());
          await this.sendToProcessSubscriberService(command, batchToProcess, SubscriberSourceEnum.TOPIC);
          totalProcessed += batchToProcess.length;

          subscribersMap.clear();
        }
      }

      if (subscribersMap.size > 0) {
        const finalBatch = Array.from(subscribersMap.values());
        await this.sendToProcessSubscriberService(command, finalBatch, SubscriberSourceEnum.TOPIC);
        totalProcessed += finalBatch.length;
      }

      await this.createMulticastTrace(
        command,
        'request_subscriber_processing_completed',
        'success',
        'Subscriber processing completed successfully',
        {
          addressingType: 'multicast',
          workflowId: command.template._id,
          totalSubscribers: totalProcessed,
          singleSubscribers: subscribersToProcess.length,
          topicSubscribers: totalProcessed - subscribersToProcess.length,
          topicsUsed: topics.length,
          subscriptionsEvaluated: totalSubscriptionsEvaluated,
          subscriptionsFiltered: totalSubscriptionsFiltered,
        }
      );
    } catch (e) {
      const error = e as Error;
      await this.createMulticastTrace(
        command,
        'request_failed',
        'error',
        `Multicast processing failed: ${error.message}`,
        {
          addressingType: 'multicast',
          workflowId: command.template._id,
          error: error.message,
          stack: error.stack,
        }
      );

      this.logger.error(
        {
          transactionId: command.transactionId,
          organization: command.organizationId,
          triggerIdentifier: command.identifier,
          userId: command.userId,
          error: e,
        },
        'Unexpected error has occurred when processing multicast'
      );

      throw e;
    }
  }

  private async evaluateSubscriptionRules(
    rules: TopicSubscriberRule[] | undefined,
    payload: Record<string, unknown>,
    workflowId: string,
    environmentId: string,
    organizationId: string
  ): Promise<boolean> {
    if (!rules || rules.length === 0) {
      this.logger.trace('No rules found, returning true');
      return true;
    }

    const results = await Promise.all(
      rules.map((rule, index) => this.evaluateRule(rule, payload, workflowId, environmentId, organizationId, index))
    );

    const allPassed = results.every((result) => result);

    return allPassed;
  }

  /**
   * Evaluates subscription rules with performance optimization by prioritizing in-memory computations
   * (boolean evaluations and condition calculations) over database queries. This approach enables
   * early termination when rules fail, avoiding unnecessary workflow filter lookups from the database.
   */
  private async evaluateRule(
    rule: TopicSubscriberRule,
    payload: Record<string, unknown>,
    workflowId: string,
    environmentId: string,
    organizationId: string,
    ruleIndex?: number
  ): Promise<boolean> {
    if (isSubscriptionCheckboxRule(rule)) {
      if (rule.condition === false) {
        this.logger.error({ nv: { ruleIndex, workflowId } }, 'Checkbox rule condition is false, returning false');
        return false;
      }

      const filterMatches = await this.checkWorkflowFilter(rule.filter, workflowId, environmentId, organizationId);

      if (!filterMatches) {
        return false;
      }

      return rule.condition === true;
    }

    if (isSubscriptionCustomRule(rule)) {
      try {
        const conditionResult = jsonLogic.apply(rule.condition, { payload });

        if (typeof conditionResult !== 'boolean' || !conditionResult) {
          this.logger.error(
            { nv: { ruleIndex, conditionResult, workflowId } },
            'Custom rule condition failed, returning false'
          );
          return false;
        }

        const filterMatches = await this.checkWorkflowFilter(rule.filter, workflowId, environmentId, organizationId);

        return filterMatches;
      } catch (error) {
        this.logger.error(
          { nv: { ruleIndex, error, workflowId }, err: error },
          'Error evaluating custom rule, returning false'
        );
        return false;
      }
    }

    this.logger.error({ nv: { rule, ruleIndex, workflowId } }, 'Invalid rule type, skipping evaluation');

    return true;
  }

  private async checkWorkflowFilter(
    filter: { workflows?: string[]; tags?: string[] } | undefined,
    workflowId: string,
    environmentId: string,
    organizationId: string
  ): Promise<boolean> {
    if (!filter) {
      return true;
    }

    const workflowIdString = String(workflowId);
    const hasWorkflowsFilter = filter.workflows && filter.workflows.length > 0;
    const hasTagsFilter = filter.tags && filter.tags.length > 0;

    if (hasWorkflowsFilter) {
      const workflowIds = filter.workflows.map((id) => String(id));
      const matchesWorkflow = workflowIds.includes(workflowIdString);

      if (matchesWorkflow) {
        return true;
      }
    }

    if (hasTagsFilter) {
      const workflowsByTags = await this.notificationTemplateRepository.find(
        {
          _environmentId: environmentId,
          _organizationId: organizationId,
          tags: { $in: filter.tags },
        },
        '_id'
      );

      const workflowIdsFromTags = workflowsByTags.map((workflow) => String(workflow._id));
      const matchesTag = workflowIdsFromTags.includes(workflowIdString);

      if (matchesTag) {
        return true;
      }
    }

    // If both filters are present and no match, return false
    if (hasWorkflowsFilter || hasTagsFilter) {
      return false;
    }

    return true;
  }

  private async createMulticastTrace(
    command: TriggerMulticastCommand,
    eventType: EventType,
    status: 'success' | 'error' | 'warning' = 'success',
    message?: string,
    rawData?: Record<string, unknown>
  ): Promise<void> {
    if (!command.requestId) {
      return;
    }

    try {
      const traceData: Omit<Trace, 'id' | 'expires_at'> = {
        created_at: LogRepository.formatDateTime64(new Date()),
        organization_id: command.organizationId,
        environment_id: command.environmentId,
        user_id: command.userId,
        subscriber_id: null,
        external_subscriber_id: null,
        event_type: eventType,
        title: mapEventTypeToTitle(eventType),
        message: message || null,
        raw_data: rawData ? JSON.stringify(rawData) : null,
        status,
        entity_type: 'request',
        entity_id: command.requestId,
        workflow_run_identifier: command.template.triggers[0].identifier,
      };

      await this.traceLogRepository.createRequest([traceData]);
    } catch (error) {
      this.logger.error(
        {
          error,
          eventType,
          transactionId: command.transactionId,
          organizationId: command.organizationId,
          environmentId: command.environmentId,
        },
        'Failed to create multicast trace'
      );
    }
  }

  private async getTopicsByTopicKeys(
    organizationId: string,
    environmentId: string,
    topicKeys: Set<string>
  ): Promise<Pick<TopicEntity, '_id' | 'key'>[]> {
    return await this.topicRepository.find(
      {
        _organizationId: organizationId,
        _environmentId: environmentId,
        key: { $in: Array.from(topicKeys) },
      },
      '_id key'
    );
  }

  private async validateTopicExist(
    command: TriggerMulticastCommand,
    topics: Pick<TopicEntity, '_id' | 'key'>[],
    topicKeys: Set<string>
  ) {
    if (topics.length === topicKeys.size) {
      return;
    }

    const storageTopicsKeys = topics.map((topic) => topic.key);
    const notFoundTopics = [...topicKeys].filter((topicKey) => !storageTopicsKeys.includes(topicKey));

    if (notFoundTopics.length > 0) {
      this.logger.warn(`Topic with key ${notFoundTopics.join()} not found in current environment`);
      await this.createMulticastTrace(command, 'topic_not_found', 'warning', 'Multicast processing failed', {
        addressingType: 'multicast',
        workflowId: command.template._id,
        topicKeys: notFoundTopics,
      });
    }
  }
}

export const splitByRecipientType = (
  mappedRecipients: TriggerRecipient[]
): {
  singleSubscribers: Map<string, ISubscribersDefine>;
  topicKeys: Set<string>;
  topicExclusions: Map<string, Set<string>>;
} => {
  return mappedRecipients.reduce(
    (acc, recipient) => {
      if (!recipient) {
        return acc;
      }

      if (isTopic(recipient)) {
        acc.topicKeys.add(recipient.topicKey);
        const topicRecipient = recipient as ITopic;
        if (topicRecipient.exclude && topicRecipient.exclude.length > 0) {
          const existingExclusions = acc.topicExclusions.get(topicRecipient.topicKey) || new Set<string>();
          for (const subscriberId of topicRecipient.exclude) {
            existingExclusions.add(subscriberId);
          }
          acc.topicExclusions.set(topicRecipient.topicKey, existingExclusions);
        }
      } else {
        const subscribersDefine = buildSubscriberDefine(recipient);

        acc.singleSubscribers.set(subscribersDefine.subscriberId, subscribersDefine);
      }

      return acc;
    },
    {
      singleSubscribers: new Map<string, ISubscribersDefine>(),
      topicKeys: new Set<string>(),
      topicExclusions: new Map<string, Set<string>>(),
    }
  );
};

export const buildSubscriberDefine = (recipient: TriggerRecipientSubscriber): ISubscribersDefine => {
  if (typeof recipient === 'string') {
    return { subscriberId: recipient };
  } else {
    validateSubscriberDefine(recipient);

    return recipient;
  }
};

export const validateSubscriberDefine = (recipient: ISubscribersDefine) => {
  if (!recipient) {
    throw new BadRequestException(
      'subscriberId under property to is not configured, please make sure all subscribers contains subscriberId property'
    );
  }

  if (Array.isArray(recipient)) {
    throw new BadRequestException(
      'subscriberId under property to is type array, which is not allowed please make sure all subscribers ids are strings'
    );
  }

  if (!recipient.subscriberId) {
    throw new BadRequestException(
      'subscriberId under property to is not configured, please make sure all subscribers contains subscriberId property'
    );
  }
};
