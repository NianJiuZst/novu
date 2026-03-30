import { CursorBasedPaginatedCommand } from '@novu/application-generic';
import { ConversationEntity } from '@novu/dal';
import { ConversationStatusEnum } from '@novu/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListConversationsCommand extends CursorBasedPaginatedCommand<
  ConversationEntity,
  'createdAt' | 'updatedAt' | 'lastMessageAt'
> {
  @IsOptional()
  @IsString()
  subscriberId?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsEnum(ConversationStatusEnum)
  status?: ConversationStatusEnum;
}
