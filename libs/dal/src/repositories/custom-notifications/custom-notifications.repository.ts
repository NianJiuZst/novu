import { BaseRepository } from '../base-repository';
import { CustomNotificationEntity } from './custom-notifications.entity';
import { CustomNotification } from './custom-notifications.schema';
import { EnvironmentId, OrganizationId } from '@novu/shared';

type SubscriberId = string;
type CustomNotificationDBModel = any;

export class CustomNotificationsRepository extends BaseRepository<
  CustomNotificationDBModel,
  CustomNotificationEntity,
  { _environmentId: EnvironmentId; _organizationId: OrganizationId }
> {
  constructor() {
    super(CustomNotification, CustomNotificationEntity);
  }

  async findBySubscriberId(
    environmentId: EnvironmentId,
    organizationId: OrganizationId,
    subscriberId: SubscriberId
  ): Promise<CustomNotificationEntity[]> {
    return this.find({
      _environmentId: environmentId,
      _organizationId: organizationId,
      _subscriberId: subscriberId,
      deleted: { $ne: true },
    });
  }

  async findEnabledBySubscriberId(
    environmentId: EnvironmentId,
    organizationId: OrganizationId,
    subscriberId: SubscriberId
  ): Promise<CustomNotificationEntity[]> {
    return this.find({
      _environmentId: environmentId,
      _organizationId: organizationId,
      _subscriberId: subscriberId,
      enabled: true,
      deleted: { $ne: true },
      $or: [{ isOneTime: false }, { isOneTime: true, completedAt: null }],
    });
  }

  async findByIdAndSubscriberId(
    id: string,
    environmentId: EnvironmentId,
    organizationId: OrganizationId,
    subscriberId: SubscriberId
  ): Promise<CustomNotificationEntity | null> {
    return this.findOne({
      _id: id,
      _environmentId: environmentId,
      _organizationId: organizationId,
      _subscriberId: subscriberId,
      deleted: { $ne: true },
    });
  }

  async countBySubscriberId(
    environmentId: EnvironmentId,
    organizationId: OrganizationId,
    subscriberId: SubscriberId
  ): Promise<number> {
    return this.count({
      _environmentId: environmentId,
      _organizationId: organizationId,
      _subscriberId: subscriberId,
      deleted: { $ne: true },
    });
  }

  async createCustomNotification(data: {
    _environmentId: EnvironmentId;
    _organizationId: OrganizationId;
    _subscriberId: SubscriberId;
    query: string;
    content: string;
    enabled?: boolean;
    isOneTime?: boolean;
  }): Promise<CustomNotificationEntity> {
    return this.create({
      ...data,
      enabled: data.enabled ?? true,
      isOneTime: data.isOneTime ?? false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async markAsCompleted(
    environmentId: EnvironmentId,
    organizationId: OrganizationId,
    subscriberId: SubscriberId,
    customNotificationId: string
  ): Promise<CustomNotificationEntity | null> {
    return this.findOneAndUpdate(
      {
        _id: customNotificationId,
        _environmentId: environmentId,
        _organizationId: organizationId,
        _subscriberId: subscriberId,
        isOneTime: true,
        completedAt: null,
      },
      {
        $set: {
          enabled: false,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  async updateCustomNotification(
    environmentId: EnvironmentId,
    organizationId: OrganizationId,
    subscriberId: SubscriberId,
    id: string,
    updates: {
      query?: string;
      content?: string;
      enabled?: boolean;
      isOneTime?: boolean;
    }
  ): Promise<CustomNotificationEntity | null> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.query !== undefined) updateData.query = updates.query;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
    if (updates.isOneTime !== undefined) {
      updateData.isOneTime = updates.isOneTime;
      // If changing from one-time to regular, reset completedAt
      if (!updates.isOneTime) {
        updateData.completedAt = null;
      }
    }

    return this.findOneAndUpdate(
      {
        _id: id,
        _environmentId: environmentId,
        _organizationId: organizationId,
        _subscriberId: subscriberId,
      },
      { $set: updateData },
      { new: true }
    );
  }

  async deleteCustomNotification(
    id: string,
    environmentId: EnvironmentId,
    organizationId: OrganizationId,
    subscriberId: SubscriberId
  ): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return await this.delete({
      _id: id,
      _environmentId: environmentId,
      _organizationId: organizationId,
      _subscriberId: subscriberId,
    });
  }
}
