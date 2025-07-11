import type { NotificationTemplateEntity, SubscriberEntity } from '@novu/dal';
import type { ITenantDefine } from '@novu/shared';
import { IsDefined, IsOptional, IsString, ValidateNested } from 'class-validator';

import { TriggerEventBroadcastCommand } from '../trigger-event';

export class TriggerBroadcastCommand extends TriggerEventBroadcastCommand {
  @IsDefined()
  template: NotificationTemplateEntity;

  @IsOptional()
  declare actor?: SubscriberEntity | undefined;

  @ValidateNested()
  declare tenant: ITenantDefine | null;

  @IsDefined()
  @IsString()
  environmentName: string;
}
