import { OrganizationLevelWithUserCommand } from '@novu/application-generic';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class DeleteEnvironmentVariableCommand extends OrganizationLevelWithUserCommand {
  @IsMongoId()
  @IsNotEmpty()
  variableId: string;
}
