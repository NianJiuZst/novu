import { Module } from '@nestjs/common';
import { featureFlagsService } from '@novu/application-generic';
import {
  CommunityOrganizationRepository,
  ConversationMessageRepository,
  ConversationRepository,
} from '@novu/dal';
import { ConversationsController } from './conversations.controller';
import { CreateConversation } from './usecases/create-conversation/create-conversation.usecase';
import { CreateConversationMessage } from './usecases/create-conversation-message/create-conversation-message.usecase';
import { GetConversation } from './usecases/get-conversation/get-conversation.usecase';
import { ListConversationMessages } from './usecases/list-conversation-messages/list-conversation-messages.usecase';
import { ListConversations } from './usecases/list-conversations/list-conversations.usecase';
import { UpdateConversation } from './usecases/update-conversation/update-conversation.usecase';

const USE_CASES = [
  ListConversations,
  CreateConversation,
  GetConversation,
  UpdateConversation,
  CreateConversationMessage,
  ListConversationMessages,
];

const DAL_MODELS = [
  ConversationRepository,
  ConversationMessageRepository,
  CommunityOrganizationRepository,
];

@Module({
  controllers: [ConversationsController],
  providers: [...USE_CASES, ...DAL_MODELS, featureFlagsService],
  exports: [...USE_CASES, ...DAL_MODELS],
})
export class ConversationsModule {}
