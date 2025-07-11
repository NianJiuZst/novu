import type { IMessageActionDto, IMessageCTADto } from '../../dto';
import type { ChannelTypeEnum, IEmailBlock } from '../../types';
import type { IActor } from '../actor';
import type { INotificationTemplate } from '../notification-template';

export interface IMessageCTA extends IMessageCTADto {}

export interface IMessageAction extends IMessageActionDto {}

export interface IMessage {
  _id: string;
  _templateId: string;
  _environmentId: string;
  _organizationId: string;
  _notificationId: string;
  _subscriberId: string;
  template?: INotificationTemplate;
  templateIdentifier?: string;
  content: string | IEmailBlock[];
  channel: ChannelTypeEnum;
  seen: boolean;
  read: boolean;
  lastSeenDate?: string;
  lastReadDate?: string;
  createdAt: string;
  cta?: IMessageCTA;
  _feedId?: string | null;
  _layoutId?: string;
  payload: Record<string, unknown>;
  data?: Record<string, unknown>;
  actor?: IActor;
  avatar?: string;
  subject?: string;
}
