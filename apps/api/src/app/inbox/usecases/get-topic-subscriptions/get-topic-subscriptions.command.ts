import { IsArray, IsBoolean, IsDefined, IsOptional, IsString } from 'class-validator';
import { EnvironmentWithSubscriber } from '../../../shared/commands/project.command';

export class GetTopicSubscriptionsCommand extends EnvironmentWithSubscriber {
  @IsString()
  @IsDefined()
  topicKey: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workflowIds?: string[];

  @IsOptional()
  @IsBoolean()
  includeEmptyState?: boolean;
}
