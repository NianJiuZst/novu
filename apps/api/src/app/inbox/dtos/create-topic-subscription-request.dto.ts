import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateTopicSubscriptionWorkflowsDto {
  @ApiProperty({
    description: 'List of workflow identifiers to subscribe to',
    example: ['workflow-id-1', 'workflow-id-2'],
    type: [String],
  })
  @IsArray()
  @IsDefined()
  ids: string[];
}

export class CreateTopicSubscriptionTopicDto {
  @ApiProperty({
    description: 'The name to set for the topic',
    example: 'Product Updates',
  })
  @IsString()
  @IsDefined()
  name: string;
}

export class CreateTopicSubscriptionRequestDto {
  @ApiPropertyOptional({
    description: 'List of workflow IDs to subscribe to (all enabled by default)',
    type: () => CreateTopicSubscriptionWorkflowsDto,
    example: {
      ids: ['workflow-id-1', 'workflow-id-2'],
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTopicSubscriptionWorkflowsDto)
  workflows?: CreateTopicSubscriptionWorkflowsDto;

  @ApiPropertyOptional({
    description: 'Optional topic information to update',
    type: () => CreateTopicSubscriptionTopicDto,
    example: {
      name: 'Product Updates',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTopicSubscriptionTopicDto)
  topic?: CreateTopicSubscriptionTopicDto;

  @ApiPropertyOptional({
    description: 'Filter workflows by tags',
    type: [String],
    example: ['billing', 'notifications'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
