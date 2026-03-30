import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateConversationRequestDto {
  @ApiProperty({ description: 'Novu subscriber id' })
  @IsDefined()
  @IsString()
  subscriberId: string;

  @ApiProperty({ description: 'Agent identifier' })
  @IsDefined()
  @IsString()
  agentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Stable id for deduplication (e.g. Slack thread_ts)' })
  @IsOptional()
  @IsString()
  platformThreadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
