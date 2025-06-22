import { Module } from '@nestjs/common';
import { CustomNotificationsRepository, SubscriberRepository } from '@novu/dal';
import { CreateCustomNotificationUseCase } from './usecases/create-custom-notification/create-custom-notification.usecase';
import { GetCustomNotificationsUseCase } from './usecases/get-custom-notifications/get-custom-notifications.usecase';
import { UpdateCustomNotificationUseCase } from './usecases/update-custom-notification/update-custom-notification.usecase';
import { DeleteCustomNotificationUseCase } from './usecases/delete-custom-notification/delete-custom-notification.usecase';

const USE_CASES = [
  CreateCustomNotificationUseCase,
  GetCustomNotificationsUseCase,
  UpdateCustomNotificationUseCase,
  DeleteCustomNotificationUseCase,
];

const REPOSITORIES = [CustomNotificationsRepository, SubscriberRepository];

@Module({
  providers: [...USE_CASES, ...REPOSITORIES],
  exports: [...USE_CASES, ...REPOSITORIES],
})
export class CustomNotificationsModule {}
