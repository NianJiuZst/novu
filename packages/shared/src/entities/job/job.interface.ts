import type { EnvironmentId, ITenantDefine, OrganizationId, StepTypeEnum } from '../../types';
import type { INotificationTemplateStep } from '../notification-template';
import type { IWorkflowStepMetadata } from '../step';
import type { JobStatusEnum } from './status.enum';

export interface IJob {
  _id: string;
  identifier: string;
  payload: any;

  overrides: Record<string, Record<string, unknown>>;
  step: INotificationTemplateStep;
  tenant?: ITenantDefine;
  transactionId: string;
  _notificationId: string;
  subscriberId: string;
  _subscriberId: string;
  _environmentId: EnvironmentId;
  _organizationId: OrganizationId;
  providerId?: string;
  _userId: string;
  delay?: number;
  _parentId?: string;
  status: JobStatusEnum;
  error?: any;
  createdAt: string;
  updatedAt: string;
  _templateId: string;
  digest?: IWorkflowStepMetadata & {
    events?: any[];
  };
  type?: StepTypeEnum;
  _actorId?: string;
}
