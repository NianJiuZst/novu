import { Transform } from 'class-transformer';
import { IsDefined, IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';
import { TopicKey, TopicName } from '../../types';

export class CreateTopicCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsDefined()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  key: TopicKey;

  @IsString()
  @IsDefined()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: TopicName;
}
