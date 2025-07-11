import { Injectable, Scope } from '@nestjs/common';
import type { OrganizationRepository } from '@novu/dal';
import type { GetOrganizationCommand } from './get-organization.command';

@Injectable()
export class GetOrganization {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(command: GetOrganizationCommand) {
    return await this.organizationRepository.findById(command.id);
  }
}
