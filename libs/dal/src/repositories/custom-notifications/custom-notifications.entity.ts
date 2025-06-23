import type { OrganizationId } from '../organization';
import type { EnvironmentId } from '../environment';
import type { SubscriberId } from '../subscriber';
import type { ChangePropsValueType } from '../../types';

export type CustomNotificationDBModel = ChangePropsValueType<
  CustomNotificationEntity,
  '_environmentId' | '_organizationId' | '_subscriberId'
>;

export class CustomNotificationEntity {
  _id: string;

  _organizationId: OrganizationId;

  _environmentId: EnvironmentId;

  _subscriberId: SubscriberId;

  /**
   * The custom notification query/prompt describing what the user wants to be notified about
   */
  query: string;

  /**
   * The content template for the notification that will be delivered to the user
   */
  content: string;

  /**
   * Whether this custom notification is active/enabled
   */
  enabled: boolean;

  /**
   * Whether this is a one-time notification that should be deactivated after being triggered
   */
  isOneTime: boolean;

  /**
   * When this one-time notification was completed/triggered (null if not completed)
   */
  completedAt?: Date | null;

  /**
   * When this custom notification was created
   */
  createdAt: Date;

  /**
   * When this custom notification was last updated
   */
  updatedAt: Date;

  /**
   * Soft delete fields
   */
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
