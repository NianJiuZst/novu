import { Injectable } from '@nestjs/common';
import type { NotificationGroupEntity, NotificationGroupRepository } from '@novu/dal';
import type { GetNotificationGroupsCommand } from './get-notification-groups.command';

@Injectable()
export class GetNotificationGroups {
  constructor(private notificationGroupRepository: NotificationGroupRepository) {}

  async execute(command: GetNotificationGroupsCommand): Promise<NotificationGroupEntity[]> {
    return await this.notificationGroupRepository.find({
      _environmentId: command.environmentId,
    });
  }
}
