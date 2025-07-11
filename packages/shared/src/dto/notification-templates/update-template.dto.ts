import type { CustomDataType } from '../../types';
import type { NotificationStepDto } from '../workflows';

export interface IUpdateNotificationTemplateDto {
  name?: string;

  tags?: string[];

  description?: string;

  identifier?: string;

  critical?: boolean;

  steps?: NotificationStepDto[];

  notificationGroupId?: string;

  data?: CustomDataType;
}
