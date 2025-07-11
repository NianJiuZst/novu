import { Injectable, NotFoundException } from '@nestjs/common';
import type { TopicEntity, TopicRepository } from '@novu/dal';
import type { TopicDto } from '../../dtos';
import type { ExternalSubscriberId } from '../../types';
import type { GetTopicCommand } from './get-topic.command';

@Injectable()
export class GetTopicUseCase {
  constructor(private topicRepository: TopicRepository) {}

  async execute(command: GetTopicCommand) {
    const topic = await this.topicRepository.findTopic(command.topicKey, command.environmentId);

    if (!topic) {
      throw new NotFoundException(
        `Topic not found for id ${command.topicKey} in the environment ${command.environmentId}`
      );
    }

    return this.mapFromEntity(topic);
  }

  private mapFromEntity(topic: TopicEntity & { subscribers: ExternalSubscriberId[] }): TopicDto {
    return {
      ...topic,
      _id: topic._id,
      _organizationId: topic._organizationId,
      _environmentId: topic._environmentId,
    };
  }
}
