import { IsOptional, IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class CreateAgentCommand extends EnvironmentWithUserCommand {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  identifier?: string;
}
