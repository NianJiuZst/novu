import { Injectable, NotFoundException } from '@nestjs/common';
import { DomainRepository } from '@novu/dal';

import { DomainResponseDto } from '../../dtos/domain-response.dto';
import { toDomainResponse } from '../../mappers/domain-response.mapper';
import { buildExpectedDnsRecords } from '../../utils/dns-records';
import { GetDomainCommand } from './get-domain.command';

@Injectable()
export class GetDomain {
  constructor(private readonly domainRepository: DomainRepository) {}

  async execute(command: GetDomainCommand): Promise<DomainResponseDto> {
    const domain = await this.domainRepository.findOneByIdAndEnvironment(
      command.domainId,
      command.environmentId,
      command.organizationId
    );

    if (!domain) {
      throw new NotFoundException(`Domain with id "${command.domainId}" not found.`);
    }

    return {
      ...toDomainResponse(domain),
      expectedDnsRecords: buildExpectedDnsRecords(domain.name),
    };
  }
}
