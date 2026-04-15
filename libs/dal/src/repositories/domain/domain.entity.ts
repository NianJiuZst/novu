import type { DomainRegionEnum } from '@novu/shared';

import type { ChangePropsValueType } from '../../types/helpers';
import type { EnvironmentId } from '../environment';
import type { OrganizationId } from '../organization';

export class DomainEntity {
  _id: string;

  name: string;

  region: DomainRegionEnum;

  _environmentId: EnvironmentId;

  _organizationId: OrganizationId;

  createdAt: string;

  updatedAt: string;
}

export type DomainDBModel = ChangePropsValueType<DomainEntity, '_environmentId' | '_organizationId'>;
