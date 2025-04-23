import { MessageRepository, JobRepository } from '@novu/dal';
import { Logger, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { UnsnoozeNotificationCommand } from './unsnooze-notification.command';
import { MarkNotificationAsCommand } from '../mark-notification-as/mark-notification-as.command';
import { MarkNotificationAs } from '../mark-notification-as/mark-notification-as.usecase';

@Injectable()
export class UnsnoozeNotification {
  private logger = new Logger(UnsnoozeNotification.name);

  constructor(
    private messageRepository: MessageRepository,
    private jobRepository: JobRepository,
    private markNotificationAs: MarkNotificationAs
  ) {}

  async execute(command: UnsnoozeNotificationCommand) {
    const scheduledMessage = await this.messageRepository.findOne({
      _id: command.notificationId,
      _environmentId: command.environmentId,
    });

    if (!scheduledMessage) {
      throw new NotFoundException(`Notification id: "${command.notificationId}" not found`);
    }

    if (!scheduledMessage._snoozeOriginMessageId || !scheduledMessage.scheduledDate) {
      throw new NotFoundException(`Notification id: "${command.notificationId}" is not snoozed`);
    }

    try {
      await this.markNotificationAs.execute(
        MarkNotificationAsCommand.create({
          environmentId: command.environmentId,
          organizationId: command.organizationId,
          subscriberId: command.subscriberId,
          notificationId: scheduledMessage._snoozeOriginMessageId,
          isSnoozeOrigin: false,
        })
      );

      await this.messageRepository.delete({
        _id: command.notificationId,
        _environmentId: command.environmentId,
      });

      await this.jobRepository.delete({
        _id: scheduledMessage._jobId,
        _environmentId: command.environmentId,
      });

      return {
        success: true,
        message: 'Notification unsnoozed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to unsnooze notification: ${command.notificationId}`, error.stack);
      throw new InternalServerErrorException(`Failed to unsnooze notification: ${error.message}`);
    }
  }
}
