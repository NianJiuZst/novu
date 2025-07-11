import { Injectable, NotFoundException } from '@nestjs/common';
import type { CommunityOrganizationRepository } from '@novu/dal';
import { DEFAULT_LOCALE } from '@novu/shared';
import type { GetOrganizationSettingsDto } from '../../dtos/get-organization-settings.dto';
import type { GetOrganizationSettingsCommand } from './get-organization-settings.command';

@Injectable()
export class GetOrganizationSettings {
  constructor(private organizationRepository: CommunityOrganizationRepository) {}

  async execute(command: GetOrganizationSettingsCommand): Promise<GetOrganizationSettingsDto> {
    const organization = await this.organizationRepository.findById(command.organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      removeNovuBranding: organization.removeNovuBranding || false,
      defaultLocale: organization.defaultLocale || DEFAULT_LOCALE,
    };
  }
}
