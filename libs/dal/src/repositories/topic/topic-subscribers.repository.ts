import { ExternalSubscriberId } from '@novu/shared';

import mongoose from 'mongoose';
import {
  CreateTopicSubscribersEntity,
  TopicSubscribersDBModel,
  TopicSubscribersEntity,
} from './topic-subscribers.entity';
import { TopicSubscribers } from './topic-subscribers.schema';
import { EnvironmentId, OrganizationId, TopicId, TopicKey } from './types';
import { BaseRepository } from '../base-repository';
import type { EnforceEnvOrOrgIds } from '../../types';

export class TopicSubscribersRepository extends BaseRepository<
  TopicSubscribersDBModel,
  TopicSubscribersEntity,
  EnforceEnvOrOrgIds
> {
  constructor() {
    super(TopicSubscribers, TopicSubscribersEntity);
  }

  async addSubscribers(subscribers: CreateTopicSubscribersEntity[]): Promise<void> {
    await this.upsertMany(subscribers);
  }

  async *getTopicDistinctSubscribers({
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
  }) {
    const { _organizationId, _environmentId, topicIds, excludeSubscribers } = query;
    const mappedTopicIds = topicIds.map((id) => this.convertStringToObjectId(id));

    const aggregatePipeline = [
      {
        $match: {
          _organizationId: this.convertStringToObjectId(_organizationId),
          _environmentId: this.convertStringToObjectId(_environmentId),
          _topicId: { $in: mappedTopicIds },
          externalSubscriberId: { $nin: excludeSubscribers },
        },
      },
      {
        $group: {
          _id: '$externalSubscriberId',
        },
      },
    ];

    for await (const doc of this._model.aggregate(aggregatePipeline, { batchSize }).cursor()) {
      yield this.mapEntity(doc);
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

  async fetchSubscriberTopics({
    subscriberIds,
    _environmentId,
    limit = 10, // Default limit
    offset = 0, // Default offset
  }: {
    subscriberIds: string[];
    _environmentId: string;
    limit?: number; // Optional parameter for limit
    offset?: number; // Optional parameter for offset
  }): Promise<Record<string, string[]>> {
    const subscriberTopics = await this._model.aggregate([
      {
        $match: {
          _environmentId: new mongoose.Types.ObjectId(_environmentId),
          externalSubscriberId: { $in: subscriberIds },
        },
      },
      {
        $sort: { topicKey: 1 }, // Sort by topicKey in ascending order
      },
      {
        $group: {
          _id: '$externalSubscriberId',
          topics: { $addToSet: '$topicKey' },
        },
      },
      {
        $skip: offset, // Skip the number of documents specified by offset
      },
      {
        $limit: limit, // Limit the number of documents returned
      },
    ]);

    return subscriberTopics.reduce((acc, item) => {
      acc[item._id] = item.topics;

      return acc;
    }, {});
  }

  async fetchSubscriberTopicCounts({
    subscriberIds,
    _environmentId,
  }: {
    subscriberIds: string[];
    _environmentId: string;
  }): Promise<Record<string, number>> {
    const subscriberTopicCounts = await this._model.aggregate([
      {
        $match: {
          _environmentId: new mongoose.Types.ObjectId(_environmentId),
          externalSubscriberId: { $in: subscriberIds },
        },
      },
      {
        $group: {
          _id: '$externalSubscriberId',
          topicCount: { $sum: 1 }, // Count the number of topics per subscriber
        },
      },
    ]);

    return subscriberTopicCounts.reduce((acc, item) => {
      acc[item._id] = item.topicCount; // Map subscriber ID to topic count

      return acc;
    }, {});
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
}
