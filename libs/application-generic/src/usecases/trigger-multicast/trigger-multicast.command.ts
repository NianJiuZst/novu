import type { NotificationTemplateEntity, SubscriberEntity } from '@novu/dal';
import type { ITenantDefine } from '@novu/shared';
import { IsDefined, IsOptional, IsString, ValidateNested } from 'class-validator';

import { TriggerEventMulticastCommand } from '../trigger-event';

export class TriggerMulticastCommand extends TriggerEventMulticastCommand {
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
