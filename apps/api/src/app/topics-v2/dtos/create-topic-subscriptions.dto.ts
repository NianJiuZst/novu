import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RulesLogic } from 'json-logic-js';

export class WorkflowPreferenceDto {
  @ApiProperty({
    description: 'The workflow identifier',
    example: 'workflow-123',
  })
  @IsString()
  @IsDefined()
  workflowId: string;

  @ApiProperty({
    description: 'Optional condition using JSON Logic rules',
    required: false,
    type: 'object',
    additionalProperties: true,
    example: { and: [{ '===': [{ var: 'tier' }, 'premium'] }] },
  })
  @ValidateIf((o) => o.condition !== undefined)
  @IsObject()
  @IsNotEmpty({ message: 'Condition cannot be an empty object. Omit the condition field if not needed.' })
  @IsOptional()
  condition?: RulesLogic;
}

export class GroupPreferenceFilterDetailsDto {
  @ApiProperty({
    description: 'List of workflow identifiers',
    type: [String],
    example: ['workflow-1', 'workflow-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workflowIds?: string[];

  @ApiProperty({
    description: 'List of tags',
    type: [String],
    example: ['tag1', 'tag2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class GroupPreferenceFilterDto {
  @ApiProperty({
    description: 'Filter criteria for workflow IDs and tags',
    type: GroupPreferenceFilterDetailsDto,
  })
  @ValidateNested()
  @Type(() => GroupPreferenceFilterDetailsDto)
  @IsDefined()
  filter: GroupPreferenceFilterDetailsDto;

  @ApiProperty({
    description: 'Optional condition using JSON Logic rules',
    required: false,
    type: 'object',
    additionalProperties: true,
    example: { and: [{ '===': [{ var: 'tier' }, 'premium'] }] },
  })
  @ValidateIf((o) => o.condition !== undefined)
  @IsObject()
  @IsNotEmpty({ message: 'Condition cannot be an empty object. Omit the condition field if not needed.' })
  @IsOptional()
  condition?: RulesLogic;
}

@ApiExtraModels(WorkflowPreferenceDto, GroupPreferenceFilterDto)
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
        { $ref: getSchemaPath(WorkflowPreferenceDto) },
        { $ref: getSchemaPath(GroupPreferenceFilterDto) },
      ],
    },
    examples: [
      'workflow-123',
      { workflowId: 'workflow-123' },
      { workflowId: 'workflow-123', condition: { '===': [{ var: 'tier' }, 'premium'] } },
      { filter: { workflowIds: ['workflow-1'], tags: ['tag1'] }, condition: { '===': [{ var: 'role' }, 'admin'] } },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  @IsOptional()
  preferences?: Array<string | WorkflowPreferenceDto | GroupPreferenceFilterDto>;
}
