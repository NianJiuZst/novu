import { IsString, IsMongoId } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class RemoveMessageCommand extends EnvironmentCommand {
  @IsString()
  @IsMongoId()
  messageId: string;
}
