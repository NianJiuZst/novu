import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDefined, IsObject, IsOptional, ValidateNested } from 'class-validator';

export class SubscriptionWorkflowsDto {
  @ApiProperty({
    description: 'List of workflow identifiers',
    example: ['workflow-id-1', 'workflow-id-2'],
    type: [String],
  })
  @IsArray()
  @IsDefined()
  ids: string[];
}

export class CreateTopicSubscriptionsRequestDto {
  @ApiProperty({
    description: 'List of subscriber identifiers to subscribe to the topic (max: 100)',
    example: ['subscriberId1', 'subscriberId2'],
    type: [String],
  })
  @IsArray()
  @IsDefined()
  @ArrayMaxSize(100, { message: 'Cannot subscribe more than 100 subscribers at once' })
  @ArrayMinSize(1, { message: 'At least one subscriber identifier is required' })
  subscriberIds: string[];

  @ApiPropertyOptional({
    description:
      'JSONLogic filter conditions for conditional subscription. Supports complex logical operations with AND, OR, and comparison operators. See https://jsonlogic.com/ for full typing reference.',
    type: 'object',
    example: {
      and: [
        {
          '==': [
            {
              var: 'payload.status',
            },
            'Completed',
          ],
        },
        {
          '>': [
            {
              var: 'payload.price',
            },
            100,
          ],
        },
      ],
    },
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'List of workflow IDs to associate with the subscription',
    type: () => SubscriptionWorkflowsDto,
    example: {
      ids: ['workflow-id-1', 'workflow-id-2'],
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubscriptionWorkflowsDto)
  workflows?: SubscriptionWorkflowsDto;
}
