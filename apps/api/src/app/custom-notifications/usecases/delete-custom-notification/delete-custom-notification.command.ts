import { IsString } from 'class-validator';
import { EnvironmentWithSubscriber } from '../../../shared/commands/project.command';

export class DeleteCustomNotificationCommand extends EnvironmentWithSubscriber {
  @IsString()
  id: string;
}
