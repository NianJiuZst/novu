import { IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class GetAgentCommand extends EnvironmentWithUserCommand {
  @IsString()
  agentId: string;
}
