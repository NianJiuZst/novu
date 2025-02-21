import { IsDefined, IsJWT } from 'class-validator';
import { BaseCommand } from '@novu/application-generic';

export class VerifySessionCommand extends BaseCommand {
  @IsDefined()
  @IsJWT()
  readonly token: string;
}
