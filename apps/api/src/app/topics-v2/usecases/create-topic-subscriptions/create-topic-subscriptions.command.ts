import { IsArray, IsDefined, IsObject, IsOptional, IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class CreateTopicSubscriptionsCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsDefined()
  topicKey: string;

  @IsString()
  @IsOptional()
  topicName?: string;

  @IsArray()
  @IsDefined()
  subscriberIds: string[];

  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  workflows?: { ids: string[] };
}
