import { Injectable, NotFoundException } from '@nestjs/common';
import { DomainRepository } from '@novu/dal';

import { DomainResponseDto } from '../../dtos/domain-response.dto';
import { toDomainResponse } from '../../mappers/domain-response.mapper';
import { CreateRouteCommand } from './create-route.command';

@Injectable()
export class CreateRoute {
  constructor(private readonly domainRepository: DomainRepository) {}

  async execute(command: CreateRouteCommand): Promise<DomainResponseDto> {
    const domain = await this.domainRepository.findOneByIdAndEnvironment(
      command.domainId,
      command.environmentId,
      command.organizationId
    );

    if (!domain) {
      throw new NotFoundException(`Domain with id "${command.domainId}" not found.`);
    }

    await this.domainRepository.update(
      {
        _id: command.domainId,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      {
        $push: {
          routes: {
            address: command.address,
            destination: command.destination,
            type: command.type,
          },
        },
      }
    );

    const updated = await this.domainRepository.findOneByIdAndEnvironment(
      command.domainId,
      command.environmentId,
      command.organizationId
    );

    return toDomainResponse(updated!);
  }
}
