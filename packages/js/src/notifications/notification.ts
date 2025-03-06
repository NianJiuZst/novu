import { InboxService } from '../api';
import { EventHandler, EventNames, Events, NovuEventEmitter } from '../event-emitter';
import { ActionTypeEnum, InboxNotification, Result } from '../types';
import { archive, completeAction, read, revertAction, unarchive, unread } from './helpers';

export class Notification implements Pick<NovuEventEmitter, 'on'>, InboxNotification {
  #emitter: NovuEventEmitter;
  #inboxService: InboxService;

  id: InboxNotification['id'];
  subject?: InboxNotification['subject'];
  body: InboxNotification['body'];
  to: InboxNotification['to'];
  isRead: InboxNotification['isRead'];
  isArchived: InboxNotification['isArchived'];
  createdAt: InboxNotification['createdAt'];
  readAt?: InboxNotification['readAt'];
  archivedAt?: InboxNotification['archivedAt'];
  avatar?: InboxNotification['avatar'];
  primaryAction?: InboxNotification['primaryAction'];
  secondaryAction?: InboxNotification['secondaryAction'];
  channelType: InboxNotification['channelType'];
  tags: InboxNotification['tags'];
  redirect: InboxNotification['redirect'];
  data?: InboxNotification['data'];

  constructor(notification: InboxNotification, emitter: NovuEventEmitter, inboxService: InboxService) {
    this.#emitter = emitter;
    this.#inboxService = inboxService;

    this.id = notification.id;
    this.subject = notification.subject;
    this.body = notification.body;
    this.to = notification.to;
    this.isRead = notification.isRead;
    this.isArchived = notification.isArchived;
    this.createdAt = notification.createdAt;
    this.readAt = notification.readAt;
    this.archivedAt = notification.archivedAt;
    this.avatar = notification.avatar;
    this.primaryAction = notification.primaryAction;
    this.secondaryAction = notification.secondaryAction;
    this.channelType = notification.channelType;
    this.tags = notification.tags;
    this.redirect = notification.redirect;
    this.data = notification.data;
  }

  update(notification: InboxNotification): void {
    this.id = notification.id;
    this.subject = notification.subject;
    this.body = notification.body;
    this.to = notification.to;
    this.isRead = notification.isRead;
    this.isArchived = notification.isArchived;
    this.createdAt = notification.createdAt;
    this.readAt = notification.readAt;
    this.archivedAt = notification.archivedAt;
    this.avatar = notification.avatar;
    this.primaryAction = notification.primaryAction;
    this.secondaryAction = notification.secondaryAction;
    this.channelType = notification.channelType;
    this.tags = notification.tags;
    this.redirect = notification.redirect;
    this.data = notification.data;
  }

  read(): Result<Notification> {
    return read({
      emitter: this.#emitter,
      apiService: this.#inboxService,
      args: {
        notification: this,
      },
    });
  }

  unread(): Result<Notification> {
    return unread({
      emitter: this.#emitter,
      apiService: this.#inboxService,
      args: {
        notification: this,
      },
    });
  }

  archive(): Result<Notification> {
    return archive({
      emitter: this.#emitter,
      apiService: this.#inboxService,
      args: {
        notification: this,
      },
    });
  }

  unarchive(): Result<Notification> {
    return unarchive({
      emitter: this.#emitter,
      apiService: this.#inboxService,
      args: {
        notification: this,
      },
    });
  }

  completePrimary(): Result<Notification> {
    if (!this.primaryAction) {
      throw new Error('Primary action is not available');
    }

    return completeAction({
      emitter: this.#emitter,
      apiService: this.#inboxService,
      args: {
        notification: this,
      },
      actionType: ActionTypeEnum.PRIMARY,
    });
  }

  completeSecondary(): Result<Notification> {
    if (!this.primaryAction) {
      throw new Error('Secondary action is not available');
    }

    return completeAction({
      emitter: this.#emitter,
      apiService: this.#inboxService,
      args: {
        notification: this,
      },
      actionType: ActionTypeEnum.SECONDARY,
    });
  }

  revertPrimary(): Result<Notification> {
    if (!this.primaryAction) {
      throw new Error('Primary action is not available');
    }

    return revertAction({
      emitter: this.#emitter,
      apiService: this.#inboxService,
      args: {
        notification: this,
      },
      actionType: ActionTypeEnum.PRIMARY,
    });
  }

  revertSecondary(): Result<Notification> {
    if (!this.primaryAction) {
      throw new Error('Secondary action is not available');
    }

    return revertAction({
      emitter: this.#emitter,
      apiService: this.#inboxService,
      args: {
        notification: this,
      },
      actionType: ActionTypeEnum.SECONDARY,
    });
  }

  on<Key extends EventNames>(eventName: Key, listener: EventHandler<Events[Key]>): () => void {
    const cleanup = this.#emitter.on(eventName, listener);

    return () => {
      cleanup();
    };
  }

  /**
   * @deprecated
   * Use the cleanup function returned by the "on" method instead.
   */
  off<Key extends EventNames>(eventName: Key, listener: EventHandler<Events[Key]>): void {
    this.#emitter.off(eventName, listener);
  }
}
