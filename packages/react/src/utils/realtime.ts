import { Notification } from '@novu/js';

export const LOCAL_STATE_EVENTS = [
  'notification.read.pending',
  'notification.read.resolved',
  'notification.unread.pending',
  'notification.unread.resolved',
  'notification.archive.pending',
  'notification.archive.resolved',
  'notification.unarchive.pending',
  'notification.unarchive.resolved',
  'notification.snooze.pending',
  'notification.snooze.resolved',
  'notification.unsnooze.pending',
  'notification.unsnooze.resolved',
] as const;

type LocalEventPayload = { data?: Notification };
type OnFn = (event: string, handler: (payload: LocalEventPayload) => void) => () => void;

export function subscribeLocalStateEvents(on: OnFn, handler: (payload: LocalEventPayload) => void): () => void {
  const cleanups = LOCAL_STATE_EVENTS.map((event) => on(event, handler));

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
