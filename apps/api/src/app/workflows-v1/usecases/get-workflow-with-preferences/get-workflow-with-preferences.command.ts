import { EnvironmentCommand } from '@novu/application-generic';
import { IsDefined, IsString } from 'class-validator';

export class GetWorkflowWithPreferencesCommand extends EnvironmentCommand {
  @IsString()
  @IsDefined()
  workflowIdOrInternalId: string;
}
