import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationMessageRoleEnum } from '@novu/shared';

export class GetConversationMessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  conversationId: string;

  @ApiProperty({ enum: ConversationMessageRoleEnum })
  role: ConversationMessageRoleEnum;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  senderName?: string;

  @ApiPropertyOptional()
  senderAvatar?: string;

  @ApiPropertyOptional()
  platform?: string;

  @ApiPropertyOptional()
  platformMessageId?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
