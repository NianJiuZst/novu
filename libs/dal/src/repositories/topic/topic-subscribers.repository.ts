import { DirectionEnum, ExternalSubscriberId } from '@novu/shared';

import { FilterQuery, mongo } from 'mongoose';
import { TopicEntity } from '../..';
import { DalException } from '../../shared';
import type { EnforceEnvOrOrgIds } from '../../types/enforce';
import { BaseRepository } from '../base-repository';
import {
  CreateTopicSubscribersEntity,
  TopicSubscribersDBModel,
  TopicSubscribersEntity,
} from './topic-subscribers.entity';
import { TopicSubscribers } from './topic-subscribers.schema';
import { EnvironmentId, OrganizationId, TopicId, TopicKey } from './types';

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

  async createSubscriptions(subscribers: CreateTopicSubscribersEntity[]): Promise<BulkAddTopicSubscribersResult> {
    const bulkUpsertWriteOps = subscribers.map((subscriber) => {
      const { _subscriberId, _topicId, conditionHash, _environmentId } = subscriber;

      return {
        updateOne: {
          filter: {
            _environmentId,
            _subscriberId,
            _topicId,
            ...(conditionHash ? ({ conditionHash } satisfies Partial<CreateTopicSubscribersEntity>) : {}),
          } satisfies Partial<CreateTopicSubscribersEntity>,
          update: { $set: subscriber },
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
      const subscriber = subscribers[numericIndex];
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
        const subscriber = subscribers[error.err.index];

        return {
          message: error.err.errmsg,
          subscriberId: subscriber?.externalSubscriberId ?? 'unknown',
          topicKey: subscriber?.topicKey ?? 'unknown',
        };
      });
    }

    const updatedSubscribers: TopicSubscribersEntity[] = subscribers
      .filter((_, index) => !indexes.includes(index))
      .map((subscriber) => subscriber as TopicSubscribersEntity);

    return {
      created: createdSubscribers,
      updated: updatedSubscribers,
      failed,
    };
  }

  async *getTopicSubscriptionsWithConditions({
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
  }): AsyncGenerator<
    Array<{
      externalSubscriberId: string;
      conditions?: Record<string, unknown>;
    }>,
    void,
    unknown
  > {
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
        {
          externalSubscriberId: 1,
          conditions: 1,
        }
      )
      .cursor({ batchSize });

    const batch: Array<{
      externalSubscriberId: string;
      conditions?: Record<string, unknown>;
    }> = [];

    for await (const doc of cursor) {
      batch.push({
        externalSubscriberId: doc.externalSubscriberId,
        conditions: doc.conditions,
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
