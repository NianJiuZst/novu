import { Injectable } from '@nestjs/common';
import type { OrganizationRepository } from '@novu/dal';
import type { RenameOrganizationCommand } from './rename-organization-command';

@Injectable()
export class RenameOrganization {
  constructor(private organizationRepository: OrganizationRepository) {}

  async execute(command: RenameOrganizationCommand) {
    const payload = {
      name: command.name,
    };

    await this.organizationRepository.renameOrganization(command.id, payload);

    return payload;
  }
}
