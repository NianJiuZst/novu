import { IsArray, IsOptional, IsString } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class UpdateAgentCommand extends EnvironmentWithUserCommand {
  @IsString()
  agentId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  integrationIds?: string[];
}
