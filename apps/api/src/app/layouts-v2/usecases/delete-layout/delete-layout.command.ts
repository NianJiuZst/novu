import { EnvironmentWithUserObjectCommand } from '@novu/application-generic';
import { IsDefined, IsString } from 'class-validator';

export class DeleteLayoutCommand extends EnvironmentWithUserObjectCommand {
  @IsString()
  @IsDefined()
  layoutIdOrInternalId: string;
}
