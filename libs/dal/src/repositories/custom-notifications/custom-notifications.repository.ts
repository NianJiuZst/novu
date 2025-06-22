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
    enabled?: boolean;
  }): Promise<CustomNotificationEntity> {
    return this.create({
      ...data,
      enabled: data.enabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateCustomNotification(
    id: string,
    environmentId: EnvironmentId,
    organizationId: OrganizationId,
    subscriberId: SubscriberId,
    updateData: { query?: string; enabled?: boolean }
  ): Promise<CustomNotificationEntity | null> {
    return this.findOneAndUpdate(
      {
        _id: id,
        _environmentId: environmentId,
        _organizationId: organizationId,
        _subscriberId: subscriberId,
        deleted: { $ne: true },
      },
      {
        ...updateData,
        updatedAt: new Date(),
      },
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
