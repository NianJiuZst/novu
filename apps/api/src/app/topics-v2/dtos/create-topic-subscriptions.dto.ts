import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDefined, IsObject, IsOptional } from 'class-validator';

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
  resourceConditions?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'JSONLogic filter conditions set by subscriber for conditional subscription. Only notifications matching these conditions will be delivered.',
    type: 'object',
    example: {
      and: [
        {
          '==': [
            {
              var: 'subscriber.data.preferences.marketing',
            },
            true,
          ],
        },
      ],
    },
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  subscriberConditions?: Record<string, unknown>;
}
