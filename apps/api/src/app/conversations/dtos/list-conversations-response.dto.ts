import { withCursorPagination } from '../../shared/dtos/cursor-paginated-response';
import { GetConversationResponseDto } from './get-conversation-response.dto';

export class ListConversationsResponseDto extends withCursorPagination(GetConversationResponseDto, {
  description: 'List of conversations',
}) {}
