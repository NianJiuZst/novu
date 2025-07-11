import type { CustomDataType } from '@novu/shared';
import type { ChangePropsValueType } from '../../types/helpers';
import type { EnvironmentId } from '../environment';
import type { OrganizationId } from '../organization';
import type { TenantId } from './types';

export class TenantEntity {
  _id: TenantId;

  identifier: string;

  name?: string;

  deleted?: boolean;

  createdAt: string;

  updatedAt: string;

  data?: CustomDataType;

  _environmentId: EnvironmentId;

  _organizationId: OrganizationId;
}

export type TenantDBModel = ChangePropsValueType<TenantEntity, '_environmentId' | '_organizationId'>;
