import { Injectable, BadRequestException } from '@nestjs/common';
import { CustomNotificationsRepository, SubscriberRepository, CustomNotificationEntity } from '@novu/dal';
import { GetCustomNotificationsCommand } from './get-custom-notifications.command';

@Injectable()
export class GetCustomNotificationsUseCase {
  constructor(
    private customNotificationsRepository: CustomNotificationsRepository,
    private subscriberRepository: SubscriberRepository
  ) {}

  async execute(command: GetCustomNotificationsCommand): Promise<CustomNotificationEntity[]> {
    // Validate subscriber exists
    const subscriber = await this.subscriberRepository.findBySubscriberId(command.environmentId, command.subscriberId);

    if (!subscriber) {
      throw new BadRequestException('Subscriber not found');
    }

    // Get all custom notifications for the subscriber
    const customNotifications = await this.customNotificationsRepository.findBySubscriberId(
      command.environmentId,
      command.organizationId,
      command.subscriberId
    );

    return customNotifications;
  }
}
