import { ChannelTypeEnum, EmailProviderIdEnum, ICredentials } from '@novu/shared';
import { SendgridEmailProvider } from '@novu/providers';

import { BaseHandler } from './base.handler';

export class SendgridHandler extends BaseHandler {
  constructor() {
    super(EmailProviderIdEnum.SendGrid, ChannelTypeEnum.EMAIL);
  }

  buildProvider(credentials: ICredentials, from?: string) {
    this.provider = new SendgridEmailProvider({
      apiKey: credentials.apiKey ?? '',
      from: from ?? '',
      senderName: credentials.senderName ?? '',
      ipPoolName: credentials.ipPoolName ?? '',
    }) as any;
  }
}
