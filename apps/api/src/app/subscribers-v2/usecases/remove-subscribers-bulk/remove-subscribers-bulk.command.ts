import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class RemoveSubscribersBulkCommand extends EnvironmentCommand {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  subscriberIds: string[];
}
