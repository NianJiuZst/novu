import { ConflictException, Injectable } from '@nestjs/common';
import { ResourceValidatorService } from '@novu/application-generic';
import { DomainRepository } from '@novu/dal';
import { DomainStatusEnum } from '@novu/shared';

import { DomainResponseDto } from '../../dtos/domain-response.dto';
import { toDomainResponse } from '../../mappers/domain-response.mapper';
import { CreateDomainCommand } from './create-domain.command';

@Injectable()
export class CreateDomain {
  constructor(
    private readonly domainRepository: DomainRepository,
    private readonly resourceValidatorService: ResourceValidatorService
  ) {}

  async execute(command: CreateDomainCommand): Promise<DomainResponseDto> {
    await this.resourceValidatorService.validateDomainsLimit(command.organizationId);

    const existing = await this.domainRepository.findOne(
      {
        name: command.name,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      ['_id']
    );

    if (existing) {
      throw new ConflictException(`A domain with name "${command.name}" already exists.`);
    }

    const domain = await this.domainRepository.create({
      name: command.name,
      status: DomainStatusEnum.PENDING,
      mxRecordConfigured: false,
      routes: [],
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
    });

    return toDomainResponse(domain);
  }
}
