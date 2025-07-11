import { Injectable, NotFoundException } from '@nestjs/common';
import type { CommunityOrganizationRepository } from '@novu/dal';
import type { OrganizationResponseDto } from '../../dtos/organization-response.dto';
import type { GetOrganizationDataCommand } from './get-organization-data.command';

@Injectable()
export class GetOrganizationData {
  constructor(private communityOrganizationRepository: CommunityOrganizationRepository) {}

  async execute(command: GetOrganizationDataCommand): Promise<OrganizationResponseDto> {
    const organization = await this.communityOrganizationRepository.findById(command.organizationId);
    if (!organization) {
      throw new NotFoundException(`Organization with id ${command.organizationId} not found`);
    }

    return {
      _id: organization._id,
      name: organization.name,
      branding: organization.branding,
    };
  }
}
