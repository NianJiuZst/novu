import { BadRequestException, Injectable } from '@nestjs/common';

import { type GetTenant, GetTenantCommand } from '@novu/application-generic';
import { DalException, type TenantRepository } from '@novu/dal';

import type { DeleteTenantCommand } from './delete-tenant.command';

@Injectable()
export class DeleteTenant {
  constructor(
    private tenantRepository: TenantRepository,
    private getTenantUsecase: GetTenant
  ) {}

  async execute(command: DeleteTenantCommand) {
    const tenant = await this.getTenantUsecase.execute(
      GetTenantCommand.create({
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        identifier: command.identifier,
      })
    );

    try {
      await this.tenantRepository.delete({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        identifier: command.identifier,
      });
    } catch (e) {
      if (e instanceof DalException) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }
}
