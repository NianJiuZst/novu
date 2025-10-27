import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EnvironmentWithSubscriber } from '../../../shared/commands/project.command';

export class UpdateTopicSubscriptionWorkflowCommand {
  @IsString()
  @IsDefined()
  id: string;

  @IsDefined()
  enabled: boolean;
}

export class UpdateTopicSubscriptionCommand extends EnvironmentWithSubscriber {
  @IsString()
  @IsDefined()
  topicKey: string;

  @IsString()
  @IsDefined()
  subscriptionId: string;

  @IsArray()
  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => UpdateTopicSubscriptionWorkflowCommand)
  workflows: UpdateTopicSubscriptionWorkflowCommand[];

  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;
}
