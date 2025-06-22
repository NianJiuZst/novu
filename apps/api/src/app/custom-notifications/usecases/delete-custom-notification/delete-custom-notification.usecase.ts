import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomNotificationsRepository, SubscriberRepository } from '@novu/dal';
import { DeleteCustomNotificationCommand } from './delete-custom-notification.command';

@Injectable()
export class DeleteCustomNotificationUseCase {
  constructor(
    private customNotificationsRepository: CustomNotificationsRepository,
    private subscriberRepository: SubscriberRepository
  ) {}

  async execute(command: DeleteCustomNotificationCommand): Promise<{ success: boolean }> {
    // Validate subscriber exists
    const subscriber = await this.subscriberRepository.findBySubscriberId(command.environmentId, command.subscriberId);

    if (!subscriber) {
      throw new BadRequestException('Subscriber not found');
    }

    // Delete the custom notification
    const deletedResult = await this.customNotificationsRepository.deleteCustomNotification(
      command.id,
      command.environmentId,
      command.organizationId,
      command.subscriberId
    );

    if (deletedResult.deletedCount === 0) {
      throw new NotFoundException('Custom notification not found');
    }

    return { success: true };
  }
}
