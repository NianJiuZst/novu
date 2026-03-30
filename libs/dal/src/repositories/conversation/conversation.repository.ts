import type { EnforceEnvOrOrgIds } from '../../types';
import { BaseRepository } from '../base-repository';
import { ConversationDBModel, ConversationEntity } from './conversation.entity';
import { ConversationModel } from './conversation.schema';

export class ConversationRepository extends BaseRepository<ConversationDBModel, ConversationEntity, EnforceEnvOrOrgIds> {
  constructor() {
    super(ConversationModel, ConversationEntity);
  }
}
