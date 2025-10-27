import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class GetTopicSubscriptionsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter workflows by tags',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter workflows by IDs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workflowIds?: string[];

  @ApiPropertyOptional({
    description: 'Include empty state with available workflows when no subscription exists',
    type: Boolean,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeEmptyState?: boolean;
}
