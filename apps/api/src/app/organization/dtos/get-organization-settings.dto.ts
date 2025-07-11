import { ApiProperty } from '@nestjs/swagger';
import { IsValidLocale } from '@novu/application-generic';
import { IsBoolean } from 'class-validator';

export class GetOrganizationSettingsDto {
  @ApiProperty({
    description: 'Remove Novu branding',
    example: false,
  })
  @IsBoolean()
  removeNovuBranding: boolean;

  @ApiProperty({
    description: 'Default locale',
    example: 'en-US',
  })
  @IsValidLocale()
  defaultLocale: string;
}
