import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationGroupRepository } from '@novu/dal';
import type { GetNotificationGroup } from '../get-notification-group/get-notification-group.usecase';
import type { UpdateNotificationGroupCommand } from './update-notification-group.command';

@Injectable()
export class UpdateNotificationGroup {
  constructor(
    private notificationGroupRepository: NotificationGroupRepository,
    private getNotificationGroup: GetNotificationGroup
  ) {}

  async execute(command: UpdateNotificationGroupCommand) {
    const { id, environmentId, name, organizationId, userId } = command;

    const item = await this.getNotificationGroup.execute({
      environmentId,
      organizationId,
      userId,
      id,
    });

    const result = await this.notificationGroupRepository.update(
      {
        _id: item._id,
        _environmentId: item._environmentId,
      },
      {
        $set: {
          name,
        },
      }
    );

    if (result.matched === 0) {
      throw new NotFoundException();
    }

    return await this.getNotificationGroup.execute({
      environmentId,
      organizationId,
      userId,
      id,
    });
  }
}
