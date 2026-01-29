import { PushProviderIdEnum } from '@novu/shared';
import { ChannelTypeEnum, IPushOptions, IPushProvider, ISendMessageSuccessResponse } from '@novu/stateless';
import apn from '@parse/node-apn';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { WithPassthrough } from '../../../utils/types';

export class APNSPushProvider extends BaseProvider implements IPushProvider {
  id = PushProviderIdEnum.APNS;
  protected casing: CasingEnum = CasingEnum.CAMEL_CASE;
  channelType = ChannelTypeEnum.PUSH as ChannelTypeEnum.PUSH;

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
    const {
      notificationIdentifiers: _notificationIdentifiers,
      sound,
      badge,
      subtitle,
      mutableContent,
      categoryId: _categoryId,
      threadId,
      title: overrideTitle,
      body: overrideBody,
      titleLocKey,
      titleLocArgs,
      bodyLocKey,
      bodyLocArgs,
      actionLocKey,
      locKey: _locKey,
      locArgs: _locArgs,
      launchImage,
      expiration,
      priority,
      collapseId,
      pushType,
      contentAvailable,
      urlArgs,
      apns: _apns,
      ...customPayload
    } = (options.overrides || {}) as Record<string, unknown>;

    const alertBody = overrideBody || options.content;
    const alertTitle = overrideTitle || options.title;

    const alertObject: Record<string, unknown> = {};

    if (alertBody) {
      alertObject.body = alertBody;
    }
    if (alertTitle) {
      alertObject.title = alertTitle;
    }
    if (subtitle) {
      alertObject.subtitle = subtitle;
    }
    if (titleLocKey) {
      alertObject.titleLocKey = titleLocKey;
    }
    if (titleLocArgs) {
      alertObject.titleLocArgs = titleLocArgs;
    }
    if (bodyLocKey) {
      alertObject.locKey = bodyLocKey;
    }
    if (bodyLocArgs) {
      alertObject.locArgs = bodyLocArgs;
    }
    if (actionLocKey) {
      alertObject.actionLocKey = actionLocKey;
    }
    if (launchImage) {
      alertObject.launchImage = launchImage;
    }

    const notificationData: Record<string, unknown> = {
      topic: this.config.bundleId,
      payload: { ...options.payload, ...customPayload },
    };

    if (Object.keys(alertObject).length > 0) {
      notificationData.alert = alertObject;
    }
    if (sound !== undefined) {
      notificationData.sound = sound;
    }
    if (badge !== undefined) {
      notificationData.badge = badge;
    }
    if (mutableContent !== undefined) {
      notificationData.mutableContent = mutableContent;
    }
    if (contentAvailable !== undefined) {
      notificationData.contentAvailable = contentAvailable;
    }
    if (urlArgs !== undefined) {
      notificationData.urlArgs = urlArgs;
    }
    if (expiration !== undefined) {
      notificationData.expiry = expiration;
    }
    if (priority !== undefined) {
      notificationData.priority = priority;
    }
    if (collapseId !== undefined) {
      notificationData.collapseId = collapseId;
    }
    if (pushType !== undefined) {
      notificationData.pushType = pushType;
    }
    if (threadId !== undefined) {
      notificationData.threadId = threadId;
    }

    const transformed = this.transform(bridgeProviderData, notificationData).body;

    const notification = new apn.Notification();

    for (const key of Object.keys(transformed)) {
      if (transformed[key] !== undefined) {
        (notification as unknown as Record<string, unknown>)[key] = transformed[key];
      }
    }

    const res = await this.provider.send(notification, options.target);

    if (res.failed.length > 0) {
      throw new Error(
        res.failed.map((failed) => `${failed.device} failed for reason: ${failed.response.reason}`).join(',')
      );
    }

    this.provider.shutdown();

    return {
      ids: res.sent?.map((response) => response.device),
      date: new Date().toISOString(),
    };
  }
}
