import { EnvironmentCommand } from '@novu/application-generic';
import type { MessageEntity } from '@novu/dal';
import type { ChannelTypeEnum } from '@novu/shared';
import { IsArray, IsDefined } from 'class-validator';
import type { IWebhookResult } from '../../dtos/webhooks-response.dto';
import type { WebhookTypes } from '../../interfaces/webhook.interface';

export class CreateExecutionDetailsCommand {
  @IsDefined()
  webhook: WebhookCommand;

  @IsDefined()
  message: MessageEntity;

  @IsDefined()
  webhookEvent: IWebhookResult;

  @IsDefined()
  channel: ChannelTypeEnum;
}

export class WebhookCommand extends EnvironmentCommand {
  @IsDefined()
  providerId: string;

  @IsDefined()
  body: any;

  @IsDefined()
  type: WebhookTypes;
}
