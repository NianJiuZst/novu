import { BadRequestException, Injectable } from '@nestjs/common';
import { TopicEntity, TopicRepository, TopicSubscribersRepository } from '@novu/dal';
import { FilterTopicsCommand } from './filter-topics.command';

import { TopicDto } from '../../dtos';
import { ExternalSubscriberId } from '../../types';

const DEFAULT_TOPIC_LIMIT = 10;
interface ITopicsPaginationObject {
  limit: number;
  page: number;
  pageSize: number;
  skip: number;
}

@Injectable()
export class FilterTopicsUseCase {
  constructor(
    private topicRepository: TopicRepository,
    private topicSubscriberRepository: TopicSubscribersRepository
  ) {}

  async execute(command: FilterTopicsCommand) {
    const { pageSize = DEFAULT_TOPIC_LIMIT, page = 0 } = command;

    if (pageSize > DEFAULT_TOPIC_LIMIT) {
      throw new BadRequestException(`Page size can not be larger then ${DEFAULT_TOPIC_LIMIT}`);
    }
    const pagination: ITopicsPaginationObject = {
      limit: pageSize,
      skip: (page <= 0 ? 0 : page) * pageSize,
      pageSize,
      page,
    };

    if (this.hasSubscriberId(command)) {
      return await this.buildPagedTopicListForSubscriberId(command, pagination);
    }

    const query = this.mapFromCommandToEntity(command);
    const filteredTopics = await this.getPaginatedTopics(command, query, pagination);

    return {
      page,
      totalCount: await this.topicRepository.count(query),
      pageSize,
      data: filteredTopics.map((topic) => this.mapFromEntityToDto(topic)),
    };
  }

  async getPaginatedTopics(
    command: FilterTopicsCommand,
    query:
      | { _environmentId: string; _organizationId: string }
      | { key: { $in: string[] }; _environmentId: string; _organizationId: string },
    pagination: ITopicsPaginationObject
  ) {
    if (command.shouldReturnSubscriberList) {
      return await this.topicRepository.filterTopicsWithSubscribers(query, pagination);
    }

    return await this.topicRepository.filterTopics(query, pagination);
  }

  private async buildPagedTopicListForSubscriberId(
    command: FilterTopicsCommand & { subscriberId: string },
    pagination: ITopicsPaginationObject
  ) {
    const { pagedTopics, totalCount } = await this.getPagedSubscriberKeys(command, pagination);
    // eslint-disable-next-line no-param-reassign
    command.keys = [...pagedTopics, ...(command.keys || [])];
    const query = this.mapFromCommandToEntity(command);
    const filteredTopics = await this.getPaginatedTopics(command, query, pagination);

    return {
      page: pagination.page,
      totalCount,
      pageSize: pagination.pageSize,
      data: filteredTopics.map((topic) => this.mapFromEntityToDto(topic)),
    };
  }

  private hasSubscriberId(command: FilterTopicsCommand): command is FilterTopicsCommand & { subscriberId: string } {
    return !!command.subscriberId;
  }

  private mapFromCommandToEntity(command: FilterTopicsCommand) {
    const baseQuery = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    };

    // Handle key filtering
    if (command.keys?.length) {
      return {
        ...baseQuery,
        key: { $in: command.keys },
      };
    }

    return baseQuery;
  }

  private mapFromEntityToDto(topic: (TopicEntity & { subscribers: ExternalSubscriberId[] }) | TopicEntity): TopicDto {
    return {
      _id: topic._id,
      _organizationId: topic._organizationId,
      _environmentId: topic._environmentId,
      key: topic.key,
      name: topic.name,
      subscribers: 'subscribers' in topic ? topic.subscribers : undefined,
    };
  }

  private async getPagedSubscriberKeys(
    command: FilterTopicsCommand & { subscriberId: string },
    pagination: {
      limit: number;
      skip: number;
    }
  ) {
    const pagedTopics = (
      await this.topicSubscriberRepository.fetchSubscriberTopics({
        subscriberIds: [command.subscriberId],
        _environmentId: command.environmentId,
        limit: pagination.limit,
        offset: pagination.skip,
      })
    )[command.subscriberId];
    const totalCount = (
      await this.topicSubscriberRepository.fetchSubscriberTopicCounts({
        subscriberIds: [command.subscriberId],
        _environmentId: command.environmentId,
      })
    )[command.subscriberId];

    return { pagedTopics, totalCount };
  }
}
