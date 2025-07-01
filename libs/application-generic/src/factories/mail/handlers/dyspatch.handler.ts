import {
  ChannelTypeEnum,
  EmailProviderIdEnum,
  ICredentials,
} from '@novu/shared';
import { DyspatchEmailProvider } from '@novu/providers';
import { BaseHandler } from './base.handler';

export class DyspatchHandler extends BaseHandler {
  constructor() {
    super(EmailProviderIdEnum.Dyspatch, ChannelTypeEnum.EMAIL);
  }

  buildProvider(credentials: ICredentials, from?: string) {
    this.provider = new DyspatchEmailProvider({
      apiKey: credentials.apiKey,
      from: from as string,
      senderName: credentials.senderName,
    });
  }
}
