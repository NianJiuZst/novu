import type { IPreferenceChannels } from '@novu/shared';
import type { ChangePropsValueType } from '../../types';
import type { EnvironmentId } from '../environment';
import type { NotificationTemplateEntity } from '../notification-template';
import type { OrganizationId } from '../organization';
import type { TenantEntity } from '../tenant';
import type { WorkflowOverrideId } from './types';

export class WorkflowOverrideEntity {
  _id: WorkflowOverrideId;

  _organizationId: OrganizationId;

  _environmentId: EnvironmentId;

  _workflowId: string;

  readonly workflow?: NotificationTemplateEntity;

  _tenantId: string;

  readonly tenant?: TenantEntity;

  active: boolean;

  preferenceSettings: IPreferenceChannels;

  deleted: boolean;

  deletedAt?: string;

  deletedBy?: string;

  createdAt: string;

  updatedAt?: string;
}

export type WorkflowOverrideDBModel = ChangePropsValueType<
  WorkflowOverrideEntity,
  '_environmentId' | '_organizationId' | '_workflowId' | '_tenantId'
>;
