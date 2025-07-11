import { Injectable } from '@nestjs/common';

import { type GetDecryptedIntegrations, GetDecryptedIntegrationsCommand } from '@novu/application-generic';
import type { IntegrationResponseDto } from '../../dtos/integration-response.dto';
import type { GetActiveIntegrationsCommand } from './get-active-integration.command';

@Injectable()
export class GetActiveIntegrations {
  constructor(private getDecryptedIntegrationsUsecase: GetDecryptedIntegrations) {}

  async execute(command: GetActiveIntegrationsCommand): Promise<IntegrationResponseDto[]> {
    const activeIntegrations = await this.getDecryptedIntegrationsUsecase.execute(
      GetDecryptedIntegrationsCommand.create({
        organizationId: command.organizationId,
        environmentId: command.environmentId,
        userId: command.userId,
        active: true,
        returnCredentials: command.returnCredentials,
      })
    );

    if (!activeIntegrations.length) {
      return [];
    }

    return activeIntegrations;
  }
}

export function notNullish<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
