import { CursorBasedPaginatedCommand } from '@novu/application-generic';
import { ConversationMessageEntity } from '@novu/dal';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class ListConversationMessagesCommand extends CursorBasedPaginatedCommand<
  ConversationMessageEntity,
  'createdAt' | 'updatedAt'
> {
  @IsDefined()
  @IsString()
  conversationIdentifier: string;

  @IsOptional()
  @IsString()
  expectedSubscriberId?: string;
}

