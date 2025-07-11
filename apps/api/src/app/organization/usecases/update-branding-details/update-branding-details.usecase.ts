import { Injectable } from '@nestjs/common';
import type { OrganizationRepository } from '@novu/dal';
import type { UpdateBrandingDetailsCommand } from './update-branding-details.command';

@Injectable()
export class UpdateBrandingDetails {
  constructor(private organizationRepository: OrganizationRepository) {}

  async execute(command: UpdateBrandingDetailsCommand) {
    const payload = {
      color: command.color,
      logo: command.logo,
      fontColor: command.fontColor,
      contentBackground: command.contentBackground,
      fontFamily: command.fontFamily,
    };

    await this.organizationRepository.updateBrandingDetails(command.id, payload);

    return payload;
  }
}
