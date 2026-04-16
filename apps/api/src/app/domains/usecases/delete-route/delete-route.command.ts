import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class DeleteRouteCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsNotEmpty()
  domainId: string;

  @IsInt()
  @Min(0)
  routeIndex: number;
}
