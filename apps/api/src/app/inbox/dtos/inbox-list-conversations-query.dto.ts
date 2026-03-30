import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatusEnum, DirectionEnum } from '@novu/shared';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Max } from 'class-validator';

export class InboxListConversationsQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  after?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  before?: string;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => Number(value))
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderBy?: 'createdAt' | 'updatedAt' | 'lastMessageAt';

  @ApiPropertyOptional({ enum: DirectionEnum })
  @IsOptional()
  @IsEnum(DirectionEnum)
  orderDirection?: DirectionEnum;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  includeCursor?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ enum: ConversationStatusEnum })
  @IsOptional()
  @IsEnum(ConversationStatusEnum)
  status?: ConversationStatusEnum;
}
