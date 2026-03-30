import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationMessageRoleEnum } from '@novu/shared';
import { IsDefined, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateConversationMessageRequestDto {
  @ApiProperty({ enum: ConversationMessageRoleEnum })
  @IsDefined()
  @IsEnum(ConversationMessageRoleEnum)
  role: ConversationMessageRoleEnum;

  @ApiProperty()
  @IsDefined()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderAvatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Idempotent key per message (e.g. Slack ts)' })
  @IsOptional()
  @IsString()
  platformMessageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
