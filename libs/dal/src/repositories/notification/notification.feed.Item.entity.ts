import type { StepTypeEnum } from '@novu/shared';
import type { ExecutionDetailsEntity } from '../execution-details';
import type { JobEntity } from '../job';
import type { NotificationTemplateEntity } from '../notification-template';
import type { SubscriberEntity } from '../subscriber';
import type { NotificationEntity } from './notification.entity';

export type NotificationFeedItemEntity = Omit<NotificationEntity, 'template'> & {
  template?: TemplateFeedItem;
  subscriber?: SubscriberFeedItem;
  jobs: JobFeedItem[];
};
export type TemplateFeedItem = Pick<NotificationTemplateEntity, '_id' | 'name' | 'triggers' | 'origin'>;

export type SubscriberFeedItem = Pick<
  SubscriberEntity,
  '_id' | 'firstName' | 'lastName' | 'email' | 'subscriberId' | 'phone'
>;

export type JobFeedItem = Pick<
  JobEntity,
  '_id' | 'status' | 'overrides' | 'payload' | 'step' | 'type' | 'providerId' | 'createdAt' | 'updatedAt' | 'digest'
> & {
  executionDetails: ExecutionDetailFeedItem[]; // Assuming ExecutionDetailFeedItem is defined
  type: StepTypeEnum;
};

export type ExecutionDetailFeedItem = Pick<
  ExecutionDetailsEntity,
  '_id' | 'providerId' | 'detail' | 'source' | '_jobId' | 'status' | 'isTest' | 'isRetry' | 'createdAt' | 'raw'
>;
