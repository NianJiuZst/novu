import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatusEnum } from '@novu/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CursorPaginationQueryDto } from './cursor-pagination-query.dto';
import { GetConversationResponseDto } from './get-conversation-response.dto';

export class ListConversationsQueryDto extends CursorPaginationQueryDto<
  GetConversationResponseDto,
  'createdAt' | 'updatedAt' | 'lastMessageAt'
> {
  @ApiPropertyOptional({ description: 'Filter by subscriber id' })
  @IsOptional()
  @IsString()
  subscriberId?: string;

  @ApiPropertyOptional({ description: 'Filter by agent id' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ enum: ConversationStatusEnum })
  @IsOptional()
  @IsEnum(ConversationStatusEnum)
  status?: ConversationStatusEnum;
}
