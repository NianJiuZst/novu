import { BaseCommand } from '@novu/application-generic';
import type { NotificationTemplateEntity } from '@novu/dal';
import { IsDefined } from 'class-validator';

export class VerifyPayloadCommand extends BaseCommand {
  @IsDefined()
  payload: Record<string, unknown>;

  @IsDefined()
  template: NotificationTemplateEntity;
}
