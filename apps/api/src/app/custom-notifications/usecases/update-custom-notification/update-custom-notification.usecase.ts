import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomNotificationsRepository, SubscriberRepository, CustomNotificationEntity } from '@novu/dal';
import { UpdateCustomNotificationCommand } from './update-custom-notification.command';

@Injectable()
export class UpdateCustomNotificationUseCase {
  constructor(
    private customNotificationsRepository: CustomNotificationsRepository,
    private subscriberRepository: SubscriberRepository
  ) {}

  async execute(command: UpdateCustomNotificationCommand): Promise<CustomNotificationEntity> {
    // Validate subscriber exists
    const subscriber = await this.subscriberRepository.findBySubscriberId(command.environmentId, command.subscriberId);

    if (!subscriber) {
      throw new BadRequestException('Subscriber not found');
    }

    // Check if at least one field is provided for update
    if (!command.query && !command.content && command.enabled === undefined) {
      throw new BadRequestException('At least one field (query, content, or enabled) must be provided for update');
    }

    // Update the custom notification
    const updatedNotification = await this.customNotificationsRepository.updateCustomNotification(
      command.environmentId,
      command.organizationId,
      command.subscriberId,
      command.id,
      {
        query: command.query,
        content: command.content,
        enabled: command.enabled,
        isOneTime: command.isOneTime,
      }
    );

    if (!updatedNotification) {
      throw new NotFoundException('Custom notification not found');
    }

    return updatedNotification;
  }
}
