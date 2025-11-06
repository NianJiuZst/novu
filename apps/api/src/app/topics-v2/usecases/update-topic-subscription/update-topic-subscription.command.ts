import { IsOptional, IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';
import { TopicSubscriberRuleDto } from '../../dtos/create-topic-subscriptions.dto';

export class UpdateTopicSubscriptionCommand extends EnvironmentWithUserCommand {
  @IsString()
  topicKey: string;

  @IsString()
  subscriptionId: string;

  @IsOptional()
  rules?: TopicSubscriberRuleDto[];

  @IsOptional()
  @IsString()
  name?: string;
}
