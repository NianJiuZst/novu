import { AuthenticatedCommand, IsValidLocale } from '@novu/application-generic';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateOrganizationSettingsCommand extends AuthenticatedCommand {
  @IsNotEmpty()
  readonly organizationId: string;

  @IsOptional()
  @IsBoolean()
  removeNovuBranding?: boolean;

  @IsOptional()
  @IsValidLocale()
  defaultLocale?: string;
}
