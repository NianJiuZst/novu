import type { EnvironmentId, OrganizationId, WorkflowOverrideId } from '../../types';
import type { INotificationTemplate } from '../notification-template';
import type { IPreferenceChannels } from '../subscriber-preference';
import type { ITenantEntity } from '../tenant';

export interface IWorkflowOverride {
  _id?: WorkflowOverrideId;

  _organizationId: OrganizationId;

  _environmentId: EnvironmentId;

  _workflowId: string;

  readonly workflow?: INotificationTemplate;

  _tenantId: string;

  readonly tenant?: ITenantEntity;

  active: boolean;

  preferenceSettings: IPreferenceChannels;

  deleted: boolean;

  deletedAt?: string;

  deletedBy?: string;

  createdAt: string;

  updatedAt?: string;
}
