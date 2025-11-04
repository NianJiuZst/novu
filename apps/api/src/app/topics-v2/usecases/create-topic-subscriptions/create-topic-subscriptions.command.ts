import { IsArray, IsDefined, IsObject, IsOptional, IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';
import { TopicSubscriberRuleDto } from '../../dtos/create-topic-subscriptions.dto';

export class CreateTopicSubscriptionsCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsDefined()
  topicKey: string;

  @IsArray()
  @IsDefined()
  subscriberIds: string[];

  @IsOptional()
  rules?: TopicSubscriberRuleDto[];

  @IsOptional()
  @IsObject()
  workflows?: { ids: string[] };
}
