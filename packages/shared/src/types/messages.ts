export enum MessagesStatusEnum {
  READ = 'read',
  SEEN = 'seen',
  UNREAD = 'unread',
  UNSEEN = 'unseen',
}

export enum MessagesDeliveryStatusEnum {
  SENT = 'sent',
  ERROR = 'error',
  WARNING = 'warning',
  SCHEDULED = 'scheduled',
}

export type UrlTarget = '_self' | '_blank' | '_parent' | '_top' | '_unfencedTop';

export type Redirect = {
  url: string;
  target?: UrlTarget;
};
