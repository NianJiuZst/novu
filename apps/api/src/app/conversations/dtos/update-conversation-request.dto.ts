import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatusEnum } from '@novu/shared';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateConversationRequestDto {
  @ApiPropertyOptional({ enum: ConversationStatusEnum })
  @IsOptional()
  @IsEnum(ConversationStatusEnum)
  status?: ConversationStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
