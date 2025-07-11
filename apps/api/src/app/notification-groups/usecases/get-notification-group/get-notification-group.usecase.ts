import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationGroupEntity, NotificationGroupRepository } from '@novu/dal';
import type { GetNotificationGroupCommand } from './get-notification-group.command';

@Injectable()
export class GetNotificationGroup {
  constructor(private notificationGroupRepository: NotificationGroupRepository) {}

  async execute(command: GetNotificationGroupCommand): Promise<NotificationGroupEntity> {
    const { id, environmentId } = command;

    const result = await this.notificationGroupRepository.findOne({
      _environmentId: environmentId,
      _id: id,
    });

    if (result === null) throw new NotFoundException();

    return result;
  }
}
