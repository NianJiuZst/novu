import { PushProviderIdEnum } from '@novu/shared';
import { ChannelTypeEnum, IPushOptions, IPushProvider, ISendMessageSuccessResponse } from '@novu/stateless';
import apn from '@parse/node-apn';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { WithPassthrough } from '../../../utils/types';

export class APNSPushProvider extends BaseProvider implements IPushProvider {
  id = PushProviderIdEnum.APNS;
  protected casing: CasingEnum = CasingEnum.CAMEL_CASE;
  channelType = ChannelTypeEnum.PUSH as ChannelTypeEnum.PUSH;

  private readonly INVALID_TOKEN_ERRORS = [
    'BadDeviceToken',
    'Unregistered',
    'DeviceTokenNotForTopic',
    'ExpiredToken',
  ];

  protected override keyCaseObject: Record<string, string> = {
    contentAvailable: 'content-available',
    launchImage: 'launch-image',
    mutableContent: 'mutable-content',
    urlArgs: 'url-args',
    titleLocKey: 'title-loc-key',
    titleLocArgs: 'title-loc-args',
    actionLocKey: 'action-loc-key',
    locKey: 'loc-key',
    locArgs: 'loc-args',
  };

  private provider: apn.Provider;
  constructor(
    private config: {
      key: string;
      keyId: string;
      teamId: string;
      bundleId: string;
      production: boolean;
    }
  ) {
    super();
    this.config = config;
    this.provider = new apn.Provider({
      token: {
        key: config.key,
        keyId: config.keyId,
        teamId: config.teamId,
      },
      production: config.production,
    });
  }

  async sendMessage(
    options: IPushOptions,
    bridgeProviderData: WithPassthrough<Record<string, unknown>> = {}
  ): Promise<ISendMessageSuccessResponse> {
    delete (options.overrides as any)?.notificationIdentifiers;
    const notification = new apn.Notification(
      this.transform(bridgeProviderData, {
        body: options.content,
        title: options.title,
        payload: options.payload,
        topic: this.config.bundleId,
        ...options.overrides,
      }).body
    );

    let res: apn.Responses;
    try {
      res = await this.provider.send(notification, options.target);
    } finally {
      this.provider.shutdown();
    }

    if (res.failed.length > 0) {
      const errorMessages = res.failed.map((failed) => {
        const reason = failed.response?.reason || failed.error?.message || 'Unknown error';

        return `${failed.device} failed for reason: ${reason}`;
      });
      throw new Error(errorMessages.join(','));
    }

    return {
      ids: res.sent?.map((response) => response.device),
      date: new Date().toISOString(),
    };
  }

  isTokenInvalid(errorMessage: string): boolean {
    return this.INVALID_TOKEN_ERRORS.some((error) => errorMessage?.includes(error));
  }
}
