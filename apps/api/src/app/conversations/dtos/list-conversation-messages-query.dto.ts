import { CursorPaginationQueryDto } from './cursor-pagination-query.dto';
import { GetConversationMessageResponseDto } from './get-conversation-message-response.dto';

export class ListConversationMessagesQueryDto extends CursorPaginationQueryDto<
  GetConversationMessageResponseDto,
  'createdAt' | 'updatedAt'
> {}
