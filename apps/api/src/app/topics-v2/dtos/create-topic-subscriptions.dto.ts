import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { ConditionType } from '@novu/dal';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AdditionalOperation, RulesLogic } from 'json-logic-js';

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

export class FilterDto {
  @ApiPropertyOptional({
    description: 'List of workflow identifiers to filter by',
    example: ['workflow-id-1', 'workflow-id-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workflows?: string[];

  @ApiPropertyOptional({
    description: 'List of tags to filter by',
    example: ['tag1', 'tag2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class CustomRuleDto {
  @ApiPropertyOptional({
    description: 'Filter configuration for the rule',
    type: FilterDto,
  })
  @ValidateNested()
  @Type(() => FilterDto)
  @IsOptional()
  filter?: FilterDto;

  @ApiProperty({
    description: 'Type of condition rule',
    enum: ConditionType,
    example: ConditionType.CUSTOM,
  })
  @IsEnum(ConditionType)
  @IsDefined()
  type: ConditionType.CUSTOM;

  @ApiPropertyOptional({
    description:
      'JSON Logic condition. Supports complex logical operations with AND, OR, and comparison operators. See https://jsonlogic.com/ for full typing reference.',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  condition?: RulesLogic<AdditionalOperation>;
}

export class SwitchRuleDto {
  @ApiPropertyOptional({
    description: 'Filter configuration for the rule',
    type: FilterDto,
  })
  @ValidateNested()
  @Type(() => FilterDto)
  @IsOptional()
  filter?: FilterDto;

  @ApiProperty({
    description: 'Type of condition rule',
    enum: ConditionType,
    example: ConditionType.SWITCH,
  })
  @IsEnum(ConditionType)
  @IsDefined()
  type: ConditionType.SWITCH;

  @ApiPropertyOptional({
    description: 'Boolean condition value',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  condition?: boolean;
}

export type TopicSubscriberRuleDto = CustomRuleDto | SwitchRuleDto;

@ApiExtraModels(CustomRuleDto, SwitchRuleDto)
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
      'Rules for conditional subscription. Supports complex logical operations with AND, OR, and comparison operators. See https://jsonlogic.com/ for full typing reference.',
    type: 'array',
    items: {
      oneOf: [{ $ref: getSchemaPath(CustomRuleDto) }, { $ref: getSchemaPath(SwitchRuleDto) }],
      discriminator: {
        propertyName: 'type',
        mapping: {
          [ConditionType.CUSTOM]: getSchemaPath(CustomRuleDto),
          [ConditionType.SWITCH]: getSchemaPath(SwitchRuleDto),
        },
      },
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    discriminator: {
      property: 'type',
      subTypes: [
        { name: ConditionType.CUSTOM, value: CustomRuleDto },
        { name: ConditionType.SWITCH, value: SwitchRuleDto },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  @IsOptional()
  rules?: TopicSubscriberRuleDto[];
}
