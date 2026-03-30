import { ApiPropertyOptional } from '@nestjs/swagger';
import { DirectionEnum } from '@novu/shared';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Max } from 'class-validator';

export class InboxListConversationMessagesQueryDto {
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
  orderBy?: 'createdAt' | 'updatedAt';

  @ApiPropertyOptional({ enum: DirectionEnum })
  @IsOptional()
  @IsEnum(DirectionEnum)
  orderDirection?: DirectionEnum;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  includeCursor?: boolean;
}
