import { withCursorPagination } from '../../shared/dtos/cursor-paginated-response';
import { GetConversationMessageResponseDto } from './get-conversation-message-response.dto';

export class ListConversationMessagesResponseDto extends withCursorPagination(GetConversationMessageResponseDto, {
  description: 'List of conversation messages',
}) {}
