import { ChannelTypeEnum, EmailProviderIdEnum, ICredentials } from '@novu/shared';
import { SendwithusEmailProvider } from '@novu/providers';

import { BaseHandler } from './base.handler';

export class SendwithusHandler extends BaseHandler {
  constructor() {
    super('sendwithus' as EmailProviderIdEnum, ChannelTypeEnum.EMAIL);
  }

  buildProvider(credentials: ICredentials, from?: string) {
    this.provider = new SendwithusEmailProvider({
      apiKey: credentials.apiKey,
      from: from as string,
      senderName: credentials.senderName,
    });
  }
}
