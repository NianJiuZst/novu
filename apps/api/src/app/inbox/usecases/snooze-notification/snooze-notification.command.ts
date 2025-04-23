import {
  IsDate,
  IsDefined,
  IsMongoId,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EnvironmentWithSubscriber } from '../../../shared/commands/project.command';

export function IsFutureDate(
  options?: {
    minBufferMs?: number;
  },
  validationOptions?: ValidationOptions
) {
  const minBufferMs = options?.minBufferMs ?? 1000 * 60; // default 1 minute

  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName,
      options: {
        message: `Snooze time must be at least ${minBufferMs / 1000} seconds in the future`,
        ...validationOptions,
      },
      validator: {
        validate(value: Date, args: ValidationArguments) {
          const now = new Date();
          const delay = value.getTime() - now.getTime();

          return delay >= minBufferMs;
        },
      },
    });
  };
}

export class SnoozeNotificationCommand extends EnvironmentWithSubscriber {
  @IsDefined()
  @IsMongoId()
  readonly notificationId: string;

  @Type(() => Date)
  @IsDate()
  @IsFutureDate({
    minBufferMs: 1000 * 60,
  })
  readonly snoozeUntil: Date;
}
