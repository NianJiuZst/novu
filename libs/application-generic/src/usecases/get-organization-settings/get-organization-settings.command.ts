import { IsNotEmpty } from 'class-validator';
import { BaseCommand } from '../../commands';

export class GetOrganizationSettingsCommand extends BaseCommand {
  @IsNotEmpty()
  readonly organizationId: string;
}
