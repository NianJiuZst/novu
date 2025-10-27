import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateTopicSubscriptionWorkflowDto {
  @ApiProperty({
    description: 'The workflow identifier',
    example: 'workflow-id-1',
  })
  @IsString()
  @IsDefined()
  id: string;

  @ApiProperty({
    description: 'Whether the workflow is enabled for this subscription',
    example: true,
  })
  @IsBoolean()
  @IsDefined()
  enabled: boolean;
}

export class UpdateTopicSubscriptionRequestDto {
  @ApiProperty({
    description: 'The workflows configuration for the subscription',
    type: [UpdateTopicSubscriptionWorkflowDto],
    example: [
      { id: 'workflow-id-1', enabled: true },
      { id: 'workflow-id-2', enabled: false },
    ],
  })
  @IsArray()
  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => UpdateTopicSubscriptionWorkflowDto)
  workflows: UpdateTopicSubscriptionWorkflowDto[];

  @ApiPropertyOptional({
    description:
      'JSONLogic filter conditions for conditional subscription. Supports complex logical operations with AND, OR, and comparison operators.',
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
}
