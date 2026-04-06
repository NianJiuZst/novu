import { OrganizationLevelWithUserCommand } from '@novu/application-generic';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class GetEnvironmentVariableCommand extends OrganizationLevelWithUserCommand {
  @IsMongoId()
  @IsNotEmpty()
  variableId: string;
}
