import { EnvironmentId } from '@novu/shared';

import { EnforceOrgId } from '../../types';
import { BaseRepositoryV2 } from '../base-repository-v2';
import { EnvironmentVariableDBModel, EnvironmentVariableEntity } from './environment-variable.entity';
import { EnvironmentVariable } from './environment-variable.schema';

export type EnvironmentVariableForTemplate = {
  key: string;
  value: string;
  isSecret: boolean;
};

export class EnvironmentVariableRepository extends BaseRepositoryV2<
  EnvironmentVariableDBModel,
  EnvironmentVariableEntity,
  EnforceOrgId
> {
  constructor() {
    super(EnvironmentVariable, EnvironmentVariableEntity);
  }

  async findByKey(organizationId: string, key: string) {
    return this.findOne({ _organizationId: organizationId, key }, '*');
  }

  async findByEnvironment(
    organizationId: string,
    environmentId: EnvironmentId
  ): Promise<EnvironmentVariableForTemplate[]> {
    const variables = await this.find({ _organizationId: organizationId }, '*');
    const resolved: EnvironmentVariableForTemplate[] = [];

    for (const variable of variables) {
      const envValue = variable.values.find((v) => v._environmentId === environmentId);

      if (envValue !== undefined) {
        resolved.push({
          key: variable.key,
          value: envValue.value as string,
          isSecret: variable.isSecret,
        });
      }
    }

    return resolved;
  }
}
