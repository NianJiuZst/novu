import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DomainRepository } from '@novu/dal';

import { DomainResponseDto } from '../../dtos/domain-response.dto';
import { toDomainResponse } from '../../mappers/domain-response.mapper';
import { DeleteRouteCommand } from './delete-route.command';

@Injectable()
export class DeleteRoute {
  constructor(private readonly domainRepository: DomainRepository) {}

  async execute(command: DeleteRouteCommand): Promise<DomainResponseDto> {
    const domain = await this.domainRepository.findOneByIdAndEnvironment(
      command.domainId,
      command.environmentId,
      command.organizationId
    );

    if (!domain) {
      throw new NotFoundException(`Domain with id "${command.domainId}" not found.`);
    }

    if (command.routeIndex >= domain.routes.length) {
      throw new BadRequestException(`Route index ${command.routeIndex} is out of bounds.`);
    }

    const routes = [...domain.routes];
    routes.splice(command.routeIndex, 1);

    await this.domainRepository.update(
      {
        _id: command.domainId,
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
      },
      { $set: { routes } }
    );

    const updated = await this.domainRepository.findOneByIdAndEnvironment(
      command.domainId,
      command.environmentId,
      command.organizationId
    );

    return toDomainResponse(updated!);
  }
}
