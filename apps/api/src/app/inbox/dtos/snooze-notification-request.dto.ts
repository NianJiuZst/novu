import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { IsFutureDate } from '../usecases/snooze-notification/snooze-notification.command';

export class SnoozeNotificationRequestDto {
  @Type(() => Date)
  @IsDate()
  @IsFutureDate({
    minBuffer: 1000 * 60,
  })
  readonly snoozeUntil: Date;
}
