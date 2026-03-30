import type { EnforceEnvOrOrgIds } from '../../types';
import { BaseRepository } from '../base-repository';
import { ConversationMessageDBModel, ConversationMessageEntity } from './conversation-message.entity';
import { ConversationMessageModel } from './conversation-message.schema';

export class ConversationMessageRepository extends BaseRepository<
  ConversationMessageDBModel,
  ConversationMessageEntity,
  EnforceEnvOrOrgIds
> {
  constructor() {
    super(ConversationMessageModel, ConversationMessageEntity);
  }
}
