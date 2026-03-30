import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatusEnum } from '@novu/shared';

export class GetConversationResponseDto {
  @ApiProperty({ description: 'Unique conversation identifier' })
  id: string;

  @ApiProperty({ description: 'Novu subscriber id' })
  subscriberId: string;

  @ApiProperty({ description: 'Agent identifier (e.g. wine-bot)' })
  agentId: string;

  @ApiProperty({ enum: ConversationStatusEnum })
  status: ConversationStatusEnum;

  @ApiPropertyOptional()
  platform?: string;

  @ApiPropertyOptional()
  platformThreadId?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  lastMessageAt?: string;

  @ApiPropertyOptional()
  lastMessagePreview?: string;

  @ApiProperty()
  messageCount: number;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
