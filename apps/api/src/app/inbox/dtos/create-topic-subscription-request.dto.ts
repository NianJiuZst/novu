import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
  GroupPreferenceFilterDto,
  WorkflowPreferenceRequestDto,
} from '../../shared/dtos/subscriptions/create-subscriptions.dto';

export class SubscriptionMetadataRequestDto {
  @ApiProperty({
    description: 'Unique identifier for this subscription',
    example: 'subscriber-123-subscription-a',
  })
  @IsString()
  @IsDefined()
  identifier?: string;

  @ApiPropertyOptional({
    description: 'The name of the subscription',
    example: 'My Subscription',
  })
  @IsString()
  @IsOptional()
  name?: string;
}

@ApiExtraModels(WorkflowPreferenceRequestDto, GroupPreferenceFilterDto, SubscriptionMetadataRequestDto)
export class CreateTopicSubscriptionRequestDto {
  @ApiProperty({
    description:
      'The subscription to subscribe to the topic. Can be either a string of the subscription ID or an object with identifier and subscriberId',
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(SubscriptionMetadataRequestDto) }],
    example: { identifier: 'subscriber-123-subscription-a', subscriberId: 'subscriber-123' },
  })
  @IsOptional()
  subscription?: string | SubscriptionMetadataRequestDto;

  @ApiProperty({
    description: 'The name of the topic',
    example: 'My Topic',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description:
      'The preferences of the topic. Can be a simple workflow ID string, workflow preference object, or group filter object',
    type: 'array',
    items: {
      oneOf: [
        { type: 'string' },
        { $ref: getSchemaPath(WorkflowPreferenceRequestDto) },
        { $ref: getSchemaPath(GroupPreferenceFilterDto) },
      ],
    },
    example: [{ workflowId: 'workflow-123', condition: { '===': [{ var: 'tier' }, 'premium'] } }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  @IsOptional()
  preferences?: Array<string | WorkflowPreferenceRequestDto | GroupPreferenceFilterDto>;
}
