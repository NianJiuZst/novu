import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriberRepository, TopicSubscribersRepository, PreferencesRepository, MessageRepository, DalException } from '@novu/dal';
import {
  buildSubscriberKey,
  buildFeedKey,
  buildMessageCountKey,
  InvalidateCacheService,
} from '@novu/application-generic';

import { RemoveSubscribersBulkCommand } from './remove-subscribers-bulk.command';

@Injectable()
export class RemoveSubscribersBulk {
  constructor(
    private invalidateCache: InvalidateCacheService,
    private subscriberRepository: SubscriberRepository,
    private topicSubscribersRepository: TopicSubscribersRepository,
    private preferenceRepository: PreferencesRepository,
    private messageRepository: MessageRepository
  ) {}

  async execute({ environmentId: _environmentId, organizationId, subscriberIds }: RemoveSubscribersBulkCommand) {
    const existingSubscribers = await this.subscriberRepository._model.find({
      subscriberId: { $in: subscriberIds },
      _environmentId,
    }).select('subscriberId _id');

    const existingSubscriberIds = existingSubscribers.map(sub => sub.subscriberId);
    const missingSubscriberIds = subscriberIds.filter(id => !existingSubscriberIds.includes(id));
    
    if (missingSubscriberIds.length > 0) {
      throw new NotFoundException({ 
        message: 'Some subscribers were not found', 
        missingSubscriberIds 
      });
    }

    const subscriberInternalIds = existingSubscribers.map(sub => sub._id);

    await Promise.all(
      subscriberIds.map(subscriberId => 
        Promise.all([
          this.invalidateCache.invalidateByKey({
            key: buildSubscriberKey({
              subscriberId,
              _environmentId,
            }),
          }),
          this.invalidateCache.invalidateQuery({
            key: buildFeedKey().invalidate({
              subscriberId,
              _environmentId,
            }),
          }),
          this.invalidateCache.invalidateQuery({
            key: buildMessageCountKey().invalidate({
              subscriberId,
              _environmentId,
            }),
          }),
        ])
      )
    );

    let deletedCount = 0;

    try {
      await this.subscriberRepository.withTransaction(async () => {
        /*
         * Note about parallelism in transactions
         *
         * Running operations in parallel is not supported during a transaction.
         * The use of Promise.all, Promise.allSettled, Promise.race, etc. to parallelize operations
         * inside a transaction is undefined behaviour and should be avoided.
         *
         * Refer to https://mongoosejs.com/docs/transactions.html#note-about-parallelism-in-transactions
         */
        const subscriberDeleteResult = await this.subscriberRepository.delete({
          subscriberId: { $in: subscriberIds },
          _environmentId,
        });

        deletedCount = subscriberDeleteResult.deletedCount || 0;

        await this.topicSubscribersRepository.delete({
          _environmentId,
          externalSubscriberId: { $in: subscriberIds },
        });

        await this.preferenceRepository.delete({
          _environmentId,
          _subscriberId: { $in: subscriberInternalIds },
        });

        await this.messageRepository.delete({
          _subscriberId: { $in: subscriberInternalIds },
          _environmentId,
        });
      });
    } catch (e) {
      if (e instanceof DalException) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }

    return {
      acknowledged: true,
      status: 'deleted',
      deletedCount,
    };
  }
}
