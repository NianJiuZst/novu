import { Injectable, Scope } from '@nestjs/common';
import type { OrganizationRepository } from '@novu/dal';
import type { GetOrganizationsCommand } from './get-organizations.command';

@Injectable({
  scope: Scope.REQUEST,
})
export class GetOrganizations {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(command: GetOrganizationsCommand) {
    return await this.organizationRepository.findUserActiveOrganizations(command.userId);
  }
}
