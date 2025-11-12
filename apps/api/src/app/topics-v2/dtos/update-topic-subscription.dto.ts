import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GroupPreferenceFilterDto, WorkflowPreferenceDto } from './create-topic-subscriptions.dto';

@ApiExtraModels(WorkflowPreferenceDto, GroupPreferenceFilterDto)
export class UpdateTopicSubscriptionRequestDto {
  @ApiProperty({
    description: 'The name of the subscription',
    example: 'My Subscription',
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
