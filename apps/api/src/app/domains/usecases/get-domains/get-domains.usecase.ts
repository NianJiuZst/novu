import { Injectable } from '@nestjs/common';
import { DomainRepository, OrganizationRepository } from '@novu/dal';
import { DomainStatusEnum, slugify } from '@novu/shared';

import { DomainResponseDto } from '../../dtos/domain-response.dto';
import { toDomainResponse } from '../../mappers/domain-response.mapper';
import { GetDomainsCommand } from './get-domains.command';

@Injectable()
export class GetDomains {
  constructor(
    private readonly domainRepository: DomainRepository,
    private readonly organizationRepository: OrganizationRepository
  ) {}

  async execute(command: GetDomainsCommand): Promise<DomainResponseDto[]> {
    const domains = await this.domainRepository.findByEnvironment(command.environmentId, command.organizationId);

    if (domains.length === 0) {
      const demoDomain = await this.getOrCreateDemoDomain(command);
      if (demoDomain) {
        return [toDomainResponse(demoDomain)];
      }
    }

    return domains.map(toDomainResponse);
  }

  private async getOrCreateDemoDomain(command: GetDomainsCommand) {
    const mailServerDomain = process.env.MAIL_SERVER_DOMAIN?.replace('https://', '').replace('/', '');
    if (!mailServerDomain) {
      return null;
    }

    const organization = await this.organizationRepository.findById(command.organizationId, 'name');
    if (!organization) {
      return null;
    }

    const demoDomainName = mailServerDomain;

    const existing = await this.domainRepository.findOne(
      {
        name: demoDomainName,
        _organizationId: command.organizationId,
        _environmentId: command.environmentId,
      },
      '*'
    );

    if (existing) {
      return existing;
    }

    return this.domainRepository.create({
      name: demoDomainName,
      status: DomainStatusEnum.VERIFIED,
      mxRecordConfigured: true,
      routes: [],
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });
  }
}
