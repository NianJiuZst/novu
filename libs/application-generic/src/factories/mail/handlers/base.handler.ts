import { IEmailOptions, IEmailProvider } from '@novu/stateless';
import { ChannelTypeEnum, EmailProviderIdEnum } from '@novu/shared';

import { IMailHandler } from '../interfaces/send.handler.interface';
import { PlatformException } from '../../../utils/exceptions';

export abstract class BaseHandler implements IMailHandler {
  protected provider: IEmailProvider;

  protected constructor(
    private providerId: EmailProviderIdEnum,
    private channelType: string
  ) {}

  canHandle(providerId: string, channelType: ChannelTypeEnum) {
    return providerId === this.providerId && channelType === this.channelType;
  }

  abstract buildProvider(credentials, options);

  async send(mailData: IEmailOptions) {
    if (process.env.NODE_ENV === 'test') {
      return {};
    }

    const { bridgeProviderData, ...otherOptions } = mailData;

    return await this.provider.sendMessage(otherOptions as any, bridgeProviderData ?? {});
  }

  public getProvider(): IEmailProvider {
    return this.provider;
  }

  async check() {
    const mailData = {
      html: '<div>checking integration</div>',
      subject: 'Checking Integration',
      to: ['no-reply@novu.co'],
    };

    const checkIntegrationResult = this.provider?.checkIntegration && (await this.provider?.checkIntegration(mailData));

    if (!checkIntegrationResult) {
      throw new PlatformException('Provider not initialized. Call buildProvider first.');
    }

    const { message, success, code } = checkIntegrationResult;

    if (!success) {
      throw new PlatformException(
        JSON.stringify({
          success,
          code,
          message: message || 'Something went wrong! Please double check your account details(Email/API key)',
        })
      );
    }

    return {
      success,
      code,
      message: 'Integration successful',
    };
  }
}
