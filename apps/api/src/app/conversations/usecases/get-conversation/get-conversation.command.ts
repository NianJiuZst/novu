import { IsDefined, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class GetConversationCommand extends EnvironmentCommand {
  @IsDefined()
  @IsString()
  identifier: string;

  @IsOptional()
  @IsString()
  expectedSubscriberId?: string;
}
