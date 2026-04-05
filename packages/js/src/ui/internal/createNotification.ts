import { InboxService } from '../../api';
import { NovuEventEmitter } from '../../event-emitter';
import { Notification } from '../../notifications/notification';
import { InboxNotification } from '../../types';

export function createNotification({
  emitter,
  inboxService,
  notification,
}: {
  emitter: NovuEventEmitter;
  inboxService: InboxService;
  notification: InboxNotification;
}): Notification {
  return new Notification(notification, emitter, inboxService);
}

export function ensureNotificationInstance({
  emitter,
  inboxService,
  notification,
}: {
  emitter: NovuEventEmitter;
  inboxService: InboxService;
  notification: InboxNotification | Notification;
}): Notification {
  if (notification instanceof Notification) {
    return notification;
  }

  return new Notification(notification, emitter, inboxService);
}
