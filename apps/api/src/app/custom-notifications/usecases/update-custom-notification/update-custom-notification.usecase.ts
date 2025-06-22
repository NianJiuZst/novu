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
      command.id,
      command.environmentId,
      command.organizationId,
      command.subscriberId,
      {
        ...(command.query && { query: command.query }),
        ...(command.content && { content: command.content }),
        ...(command.enabled !== undefined && { enabled: command.enabled }),
      }
    );

    if (!updatedNotification) {
      throw new NotFoundException('Custom notification not found');
    }

    return updatedNotification;
  }
}
