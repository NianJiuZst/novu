import { IsString, IsMongoId } from 'class-validator';
import { EnvironmentWithSubscriber } from '../../../shared/commands/project.command';

export class RemoveMessageCommand extends EnvironmentWithSubscriber {
  @IsString()
  @IsMongoId()
  messageId: string;
}
