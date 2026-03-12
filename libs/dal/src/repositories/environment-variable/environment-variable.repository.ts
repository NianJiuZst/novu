import { EnvironmentId } from '@novu/shared';

import { EnforceOrgId } from '../../types';
import { BaseRepositoryV2 } from '../base-repository-v2';
import { EnvironmentVariableDBModel, EnvironmentVariableEntity } from './environment-variable.entity';
import { EnvironmentVariable } from './environment-variable.schema';

export class EnvironmentVariableRepository extends BaseRepositoryV2<
  EnvironmentVariableDBModel,
  EnvironmentVariableEntity,
  EnforceOrgId
> {
  constructor() {
    super(EnvironmentVariable, EnvironmentVariableEntity);
  }

  async findByOrganization(organizationId: string) {
    return this.find({ _organizationId: organizationId }, '*', { sort: { createdAt: -1 } });
  }

  async findByKey(organizationId: string, key: string) {
    return this.findOne({ _organizationId: organizationId, key }, '*');
  }

  async resolveForEnvironment(organizationId: string, environmentId: EnvironmentId): Promise<Record<string, string>> {
    const variables = await this.find({ _organizationId: organizationId }, '*');
    const resolved: Record<string, string> = {};

    for (const variable of variables) {
      const envValue = variable.values.find((v) => v._environmentId === environmentId);

      if (envValue !== undefined) {
        resolved[variable.key] = envValue.value as string;
      }
    }

    return resolved;
  }
}
