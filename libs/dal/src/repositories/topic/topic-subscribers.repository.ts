import { DirectionEnum, ExternalSubscriberId } from '@novu/shared';

import { FilterQuery, mongo } from 'mongoose';
import { TopicEntity } from '../..';
import { DalException } from '../../shared';
import type { EnforceEnvOrOrgIds } from '../../types/enforce';
import { BaseRepository } from '../base-repository';
import {
  CreateTopicSubscribersEntity,
  TopicSubscriberRule,
  TopicSubscribersDBModel,
  TopicSubscribersEntity,
} from './topic-subscribers.entity';
import { TopicSubscribers } from './topic-subscribers.schema';
import { EnvironmentId, OrganizationId, TopicId, TopicKey } from './types';

type SelectedTopicSubscriberFields = Pick<TopicSubscribersEntity, 'externalSubscriberId' | 'rules'>;

export const SELECTED_TOPIC_SUBSCRIBER_FIELDS_PROJECTION = {
  externalSubscriberId: 1,
  rules: 1,
} as const satisfies Record<keyof SelectedTopicSubscriberFields, 1>;

export interface BulkAddTopicSubscribersResult {
  created: TopicSubscribersEntity[];
  updated: TopicSubscribersEntity[];
  failed: Array<{
    message: string;
    subscriberId: string;
    topicKey: string;
  }>;
}

export class TopicSubscribersRepository extends BaseRepository<
  TopicSubscribersDBModel,
  TopicSubscribersEntity,
  EnforceEnvOrOrgIds
> {
  constructor() {
    super(TopicSubscribers, TopicSubscribersEntity);
  }

  async findTopicsByTopicKeys(
    environmentId: EnvironmentId,
    topicKeys: TopicKey[]
  ): Promise<{ _id: string; topic: TopicEntity }[]> {
    if (!topicKeys.length) {
      return [];
    }

    const aggregationPipeline = [
      {
        $match: {
          _environmentId: this.convertStringToObjectId(environmentId),
          topicKey: { $in: topicKeys },
        },
      },
      {
        $lookup: {
          from: 'topics',
          localField: '_topicId',
          foreignField: '_id',
          as: 'topic',
        },
      },
      { $unwind: '$topic' },
      {
        $group: {
          _id: '$topicKey',
          topic: { $first: '$topic' },
        },
      },
    ];

    return await this.aggregate(aggregationPipeline);
  }

  async createSubscriptions(subscriptions: CreateTopicSubscribersEntity[]): Promise<BulkAddTopicSubscribersResult> {
    const bulkUpsertWriteOps = subscriptions.map((subscription) => {
      const { _subscriberId, _topicId, rulesHash, _environmentId } = subscription;

      return {
        updateOne: {
          filter: {
            _environmentId,
            _subscriberId,
            _topicId,
            ...(rulesHash ? ({ rulesHash } satisfies Partial<CreateTopicSubscribersEntity>) : {}),
          } satisfies Partial<CreateTopicSubscribersEntity>,
          update: { $set: subscription },
          upsert: true,
        },
      };
    });

    let bulkResponse: mongo.BulkWriteResult;
    try {
      bulkResponse = await this.bulkWrite(bulkUpsertWriteOps);
    } catch (e: unknown) {
      if (isErrorWithWriteErrors(e)) {
        if (!e.writeErrors) {
          throw new DalException(e.message || 'Unknown error');
        }
        bulkResponse = e.result as mongo.BulkWriteResult;
      } else {
        throw new DalException('An unknown error occurred while adding topic subscribers');
      }
    }

    const upsertedIds = bulkResponse.upsertedIds || {};
    const writeErrors = bulkResponse.getWriteErrors() || [];

    const indexes: number[] = [];

    const createdSubscribers: TopicSubscribersEntity[] = [];
    for (const [index, _id] of Object.entries(upsertedIds)) {
      const numericIndex = parseInt(index, 10);
      indexes.push(numericIndex);
      const subscriber = subscriptions[numericIndex];
      if (subscriber) {
        createdSubscribers.push({
          _id: _id.toString(),
          ...subscriber,
        } as TopicSubscribersEntity);
      }
    }

    let failed: Array<{ message: string; subscriberId: string; topicKey: string }> = [];
    if (writeErrors.length > 0) {
      failed = writeErrors.map((error) => {
        indexes.push(error.err.index);
        const subscriber = subscriptions[error.err.index];

        return {
          message: error.err.errmsg,
          subscriberId: subscriber?.externalSubscriberId ?? 'unknown',
          topicKey: subscriber?.topicKey ?? 'unknown',
        };
      });
    }

    const updatedSubscribers: TopicSubscribersEntity[] = subscriptions
      .filter((_, index) => !indexes.includes(index))
      .map((subscriber) => subscriber as TopicSubscribersEntity);

    return {
      created: createdSubscribers,
      updated: updatedSubscribers,
      failed,
    };
  }

  async *getTopicSubscriptionsWithRules({
    query,
    batchSize = 500,
  }: {
    query: {
      _environmentId: EnvironmentId;
      _organizationId: OrganizationId;
      topicIds: string[];
      excludeSubscribers: string[];
    };
    batchSize?: number;
  }): AsyncGenerator<Array<SelectedTopicSubscriberFields>, void, unknown> {
    const { _organizationId, _environmentId, topicIds, excludeSubscribers } = query;
    const mappedTopicIds = topicIds.map((id) => this.convertStringToObjectId(id));

    const cursor = this._model
      .find(
        {
          _organizationId: this.convertStringToObjectId(_organizationId),
          _environmentId: this.convertStringToObjectId(_environmentId),
          _topicId: { $in: mappedTopicIds },
          externalSubscriberId: { $nin: excludeSubscribers },
        },
        SELECTED_TOPIC_SUBSCRIBER_FIELDS_PROJECTION
      )
      .cursor({ batchSize });

    const batch: Array<{
      externalSubscriberId: string;
      rules?: TopicSubscriberRule[];
    }> = [];

    for await (const doc of cursor) {
      const selectedDoc = doc as SelectedTopicSubscriberFields;
      batch.push({
        externalSubscriberId: selectedDoc.externalSubscriberId,
        rules: selectedDoc.rules,
      });

      if (batch.length >= batchSize) {
        yield [...batch];
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      yield batch;
    }
  }

  async findOneByTopicKeyAndExternalSubscriberId(
    _environmentId: EnvironmentId,
    _organizationId: OrganizationId,
    topicKey: TopicKey,
    externalSubscriberId: ExternalSubscriberId
  ): Promise<TopicSubscribersEntity | null> {
    return this.findOne({
      _environmentId,
      _organizationId,
      topicKey,
      externalSubscriberId,
    });
  }

  async findSubscribersByTopicId(
    _environmentId: EnvironmentId,
    _organizationId: OrganizationId,
    _topicId: TopicId
  ): Promise<TopicSubscribersEntity[]> {
    return this.find({
      _environmentId,
      _organizationId,
      _topicId,
    });
  }

  async removeSubscribers(
    _environmentId: EnvironmentId,
    _organizationId: OrganizationId,
    topicKey: TopicKey,
    externalSubscriberIds: ExternalSubscriberId[]
  ): Promise<void> {
    await this.delete({
      _environmentId,
      _organizationId,
      topicKey,
      externalSubscriberId: {
        $in: externalSubscriberIds,
      },
    });
  }

  async countSubscriptionsPerSubscriber({
    environmentId,
    organizationId,
    topicId,
    subscriberIds,
  }: {
    environmentId: EnvironmentId;
    organizationId: OrganizationId;
    topicId: TopicId;
    subscriberIds: string[];
  }): Promise<Map<string, number>> {
    if (subscriberIds.length === 0) {
      return new Map();
    }

    const aggregationResults = await this.aggregate([
      {
        $match: {
          _environmentId: this.convertStringToObjectId(environmentId),
          _organizationId: this.convertStringToObjectId(organizationId),
          _topicId: this.convertStringToObjectId(topicId),
          _subscriberId: {
            $in: subscriberIds.map((id) => this.convertStringToObjectId(id)),
          },
        },
      },
      {
        $group: {
          _id: '$_subscriberId',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map<string, number>();
    for (const result of aggregationResults) {
      countMap.set(result._id.toString(), result.count);
    }

    return countMap;
  }

  async findTopicSubscriptionsWithPagination({
    environmentId,
    organizationId,
    topicKey,
    subscriberId,
    limit = 10,
    before,
    after,
    orderDirection = DirectionEnum.DESC,
    includeCursor,
  }): Promise<{
    data: TopicSubscribersEntity[];
    next: string | null;
    previous: string | null;
    totalCount: number;
    totalCountCapped: boolean;
  }> {
    // Build query for topic subscriptions
    const query: FilterQuery<TopicSubscribersDBModel> & EnforceEnvOrOrgIds = {
      _environmentId: environmentId,
      _organizationId: organizationId,
    };

    if (topicKey) {
      query.topicKey = topicKey;
    }

    if (subscriberId) {
      query.externalSubscriberId = subscriberId;
    }

    // Handle cursor-based pagination
    let subscription: TopicSubscribersEntity | null = null;
    const id = before || after;

    if (id) {
      subscription = await this.findOne({
        _environmentId: environmentId,
        _organizationId: organizationId,
        _id: id,
      });

      if (!subscription) {
        return {
          data: [],
          next: null,
          previous: null,
          totalCount: 0,
          totalCountCapped: false,
        };
      }
    }

    const afterCursor =
      after && subscription
        ? {
            sortBy: subscription._id,
            paginateField: subscription._id,
          }
        : undefined;
    const beforeCursor =
      before && subscription
        ? {
            sortBy: subscription._id,
            paginateField: subscription._id,
          }
        : undefined;

    // Use cursor-based pagination
    const subscriptionsPagination = await this.findWithCursorBasedPagination({
      query,
      paginateField: '_id',
      sortBy: '_id',
      sortDirection: orderDirection,
      limit,
      after: afterCursor,
      before: beforeCursor,
      includeCursor,
    });

    return subscriptionsPagination;
  }
}

function isErrorWithWriteErrors(e: unknown): e is { writeErrors?: unknown; message?: string; result?: unknown } {
  return typeof e === 'object' && e !== null && 'writeErrors' in e;
}
