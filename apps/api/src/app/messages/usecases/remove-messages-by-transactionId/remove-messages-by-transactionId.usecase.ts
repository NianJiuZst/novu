import { Injectable, NotFoundException } from '@nestjs/common';

import { buildFeedKey, buildMessageCountKey, InvalidateCacheService } from '@novu/application-generic';
import { EnforceEnvId, MessageEntity, MessageRepository, SubscriberRepository } from '@novu/dal';

import { RemoveMessagesByTransactionIdCommand } from './remove-messages-by-transactionId.command';

const SUBSCRIBER_ID_LOOKUP_BATCH = 500;

@Injectable()
export class RemoveMessagesByTransactionId {
  constructor(
    private messageRepository: MessageRepository,
    private subscriberRepository: SubscriberRepository,
    private invalidateCache: InvalidateCacheService
  ) {}

  async execute(command: RemoveMessagesByTransactionIdCommand) {
    const baseQuery: Partial<MessageEntity> & EnforceEnvId = {
      transactionId: command.transactionId,
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    };

    if (command.channel) {
      baseQuery.channel = command.channel;
    }

    const matchCount = await this.messageRepository.countMessagesForDeleteByTransactionQuery(baseQuery);

    if (matchCount === 0) {
      throw new NotFoundException('Invalid transactionId or channel');
    }

    const subscriberObjectIds =
      await this.messageRepository.distinctSubscriberObjectIdsForDeleteByTransaction(baseQuery);

    for (let i = 0; i < subscriberObjectIds.length; i += SUBSCRIBER_ID_LOOKUP_BATCH) {
      const chunk = subscriberObjectIds.slice(i, i + SUBSCRIBER_ID_LOOKUP_BATCH);
      const subscribers = await this.subscriberRepository.find(
        {
          _id: { $in: chunk },
          _environmentId: command.environmentId,
        },
        'subscriberId'
      );

      for (const sub of subscribers) {
        if (!sub.subscriberId) {
          continue;
        }

        await this.invalidateCache.invalidateQuery({
          key: buildMessageCountKey().invalidate({
            subscriberId: sub.subscriberId,
            _environmentId: command.environmentId,
          }),
        });
        await this.invalidateCache.invalidateQuery({
          key: buildFeedKey().invalidate({
            subscriberId: sub.subscriberId,
            _environmentId: command.environmentId,
          }),
        });
      }
    }

    const deletedCount = await this.messageRepository.deleteManyForDeleteByTransactionQuery(baseQuery);

    if (deletedCount === 0) {
      throw new NotFoundException('Invalid transactionId or channel');
    }
  }
}
