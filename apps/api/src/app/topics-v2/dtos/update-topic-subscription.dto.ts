import { ApiExtraModels, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { TopicSubscriberRuleDto } from './create-topic-subscriptions.dto';

@ApiExtraModels(TopicSubscriberRuleDto)
export class UpdateTopicSubscriptionRequestDto {
  @ApiPropertyOptional({
    description:
      'Rules for conditional subscription. Supports complex logical operations with AND, OR, and comparison operators, or boolean values. See https://jsonlogic.com/ for full typing reference.',
    type: 'array',
    items: {
      $ref: getSchemaPath(TopicSubscriberRuleDto),
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicSubscriberRuleDto)
  @IsOptional()
  rules?: TopicSubscriberRuleDto[];
}
