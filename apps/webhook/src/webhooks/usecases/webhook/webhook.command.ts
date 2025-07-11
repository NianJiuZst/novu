import { EnvironmentCommand } from '@novu/application-generic';
import { IsDefined } from 'class-validator';

import type { WebhookTypes } from '../../interfaces/webhook.interface';

export class WebhookCommand extends EnvironmentCommand {
  @IsDefined()
  providerOrIntegrationId: string;

  @IsDefined()
  body: any;

  @IsDefined()
  type: WebhookTypes;
}
