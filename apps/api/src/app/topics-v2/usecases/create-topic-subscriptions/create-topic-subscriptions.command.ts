import { IsArray, IsDefined, IsOptional, IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';
import { GroupPreferenceFilterDto } from '../../dtos/create-topic-subscriptions.dto';

export class CreateTopicSubscriptionsCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsDefined()
  topicKey: string;

  @IsArray()
  @IsDefined()
  subscriberIds: string[] | { identifier: string; subscriberId: string }[]; // todo refactor to use the new property

  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  preferences?: Array<GroupPreferenceFilterDto>;
}
