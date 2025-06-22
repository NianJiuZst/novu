import { Injectable, BadRequestException } from '@nestjs/common';
import { CustomNotificationsRepository, SubscriberRepository, CustomNotificationEntity } from '@novu/dal';
import { CreateCustomNotificationCommand } from './create-custom-notification.command';

@Injectable()
export class CreateCustomNotificationUseCase {
  constructor(
    private customNotificationsRepository: CustomNotificationsRepository,
    private subscriberRepository: SubscriberRepository
  ) {}

  async execute(command: CreateCustomNotificationCommand): Promise<CustomNotificationEntity> {
    // Validate subscriber exists
    const subscriber = await this.subscriberRepository.findBySubscriberId(command.environmentId, command.subscriberId);

    if (!subscriber) {
      throw new BadRequestException('Subscriber not found');
    }

    // Check if subscriber has reached the limit (e.g., 10 custom notifications)
    const existingCount = await this.customNotificationsRepository.countBySubscriberId(
      command.environmentId,
      command.organizationId,
      command.subscriberId
    );

    const MAX_CUSTOM_NOTIFICATIONS = 10;
    if (existingCount >= MAX_CUSTOM_NOTIFICATIONS) {
      throw new BadRequestException(`Maximum number of custom notifications (${MAX_CUSTOM_NOTIFICATIONS}) reached`);
    }

    // Create the custom notification
    const customNotification = await this.customNotificationsRepository.createCustomNotification({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _subscriberId: command.subscriberId,
      query: command.query,
      content: command.content,
      enabled: command.enabled ?? true,
    });

    return customNotification;
  }
}
