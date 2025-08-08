import {
  checkNotificationMatchesFilter,
  isSameFilter,
  ListNotificationsResponse,
  Notification,
  NotificationFilter,
  NovuError,
} from '@novu/js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { subscribeLocalStateEvents } from '../utils/realtime';
import { useWebSocketEvent } from './internal/useWebsocketEvent';
import { useNovu } from './NovuProvider';

/**
 * Props for the useNotifications hook.
 *
 * @example
 * ```tsx
 * // Get unread notifications
 * const { notifications } = useNotifications({
 *   read: false
 * });
 *
 * // Get unseen notifications with specific tags
 * const { notifications } = useNotifications({
 *   seen: false,
 *   tags: ['important']
 * });
 *
 * // Get notifications (auto-updates in real time when new notifications arrive)
 * const { notifications } = useNotifications({
 *   read: false
 * });
 * ```
 */
export type UseNotificationsProps = {
  tags?: string[];
  data?: Record<string, unknown>;
  read?: boolean;
  archived?: boolean;
  snoozed?: boolean;
  seen?: boolean;
  limit?: number;
  onSuccess?: (data: Notification[]) => void;
  onError?: (error: NovuError) => void;
};

export type UseNotificationsResult = {
  notifications?: Notification[];
  error?: NovuError;
  isLoading: boolean;
  isFetching: boolean;
  hasMore: boolean;
  readAll: () => Promise<{
    data?: void | undefined;
    error?: NovuError | undefined;
  }>;
  seenAll: () => Promise<{
    data?: void | undefined;
    error?: NovuError | undefined;
  }>;
  archiveAll: () => Promise<{
    data?: void | undefined;
    error?: NovuError | undefined;
  }>;
  archiveAllRead: () => Promise<{
    data?: void | undefined;
    error?: NovuError | undefined;
  }>;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
};

export const useNotifications = (props?: UseNotificationsProps): UseNotificationsResult => {
  const {
    tags,
    data: dataFilter,
    read,
    archived = false,
    snoozed = false,
    seen,
    limit,
    onSuccess,
    onError,
  } = props || {};
  const filterRef = useRef<NotificationFilter | undefined>(undefined);
  const { notifications, on } = useNovu();
  const [data, setData] = useState<Array<Notification>>();
  const [error, setError] = useState<NovuError>();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const length = data?.length;
  const after = length ? data[length - 1].id : undefined;

  const sync = useCallback((event: { data?: ListNotificationsResponse }) => {
    if (!event.data || (filterRef.current && !isSameFilter(filterRef.current, event.data.filter))) {
      return;
    }
    setData(event.data.notifications);
    setHasMore(event.data.hasMore);
  }, []);

  useEffect(() => {
    const cleanup = on('notifications.list.updated', sync);

    return () => {
      cleanup();
    };
  }, [on, sync]);

  const effectiveLimit = useMemo(() => (typeof limit === 'number' ? limit : 10), [limit]);

  const updateCache = useCallback(
    (updater: (current: ListNotificationsResponse) => ListNotificationsResponse | undefined) => {
      const args = { ...(filterRef.current || {}), limit: effectiveLimit } as any;
      const current = notifications.cache.getAll(args) || {
        hasMore: false,
        filter: filterRef.current || {},
        notifications: [],
      };
      const next = updater(current);
      if (!next) return;
      notifications.cache.update(args, next);
    },
    [effectiveLimit, notifications.cache]
  );

  const prependIfMatches = useCallback(
    (updated: Notification) => {
      const currentFilter = filterRef.current;
      if (!currentFilter) return;
      const matches = checkNotificationMatchesFilter(updated, currentFilter);
      if (!matches) return;

      updateCache((current) => {
        if (current.notifications.some((n) => n.id === updated.id)) return undefined;
        const next = [updated, ...current.notifications];
        const trimmed = next.length > effectiveLimit ? next.slice(0, effectiveLimit) : next;

        return { ...current, notifications: trimmed };
      });
    },
    [effectiveLimit, updateCache]
  );

  const removeIfNoLongerMatches = useCallback(
    (updated: Notification) => {
      updateCache((current) => {
        const exists = current.notifications.some((n) => n.id === updated.id);
        if (!exists) return undefined;
        const currentFilter = filterRef.current;
        if (currentFilter && checkNotificationMatchesFilter(updated, currentFilter)) return undefined;
        const next = current.notifications.filter((n) => n.id !== updated.id);

        return { ...current, notifications: next };
      });
    },
    [updateCache]
  );

  useWebSocketEvent({
    event: 'notifications.notification_received',
    eventHandler: ({ result: notification }) => {
      prependIfMatches(notification);
    },
  });

  // Local state changes: move notifications between lists instantly within the same app
  useEffect(() => {
    const cleanup = subscribeLocalStateEvents(
      on as unknown as (event: string, handler: (payload: { data?: Notification }) => void) => () => void,
      ({ data }) => {
        if (!data) return;
        removeIfNoLongerMatches(data);
        prependIfMatches(data);
      }
    );

    return () => {
      cleanup();
    };
  }, [on, prependIfMatches, removeIfNoLongerMatches]);

  const fetchNotifications = useCallback(
    async (options?: { refetch: boolean }) => {
      if (options?.refetch) {
        setError(undefined);
        setIsLoading(true);
        setIsFetching(false);
      }
      setIsFetching(true);
      const response = await notifications.list({
        tags,
        data: dataFilter,
        read,
        archived,
        snoozed,
        seen,
        limit,
        after: options?.refetch ? undefined : after,
      });
      if (response.error) {
        setError(response.error);
        onError?.(response.error);
      } else if (response.data) {
        onSuccess?.(response.data.notifications);
        setData(response.data.notifications);
        setHasMore(response.data.hasMore);
      }
      setIsLoading(false);
      setIsFetching(false);
    },
    [notifications, tags, dataFilter, read, archived, snoozed, seen, limit, after, onError, onSuccess]
  );

  useEffect(() => {
    const newFilter = { tags, data: dataFilter, read, archived, snoozed, seen };
    if (filterRef.current && isSameFilter(filterRef.current, newFilter)) {
      return;
    }
    notifications.clearCache({ filter: filterRef.current });
    filterRef.current = newFilter;

    fetchNotifications({ refetch: true });
  }, [tags, dataFilter, read, archived, snoozed, seen, notifications, fetchNotifications]);

  const refetch = () => {
    notifications.clearCache({ filter: { tags, read, archived, snoozed, seen, data: dataFilter } });

    return fetchNotifications({ refetch: true });
  };

  const fetchMore = async () => {
    if (!hasMore || isFetching) return;

    return fetchNotifications();
  };

  const readAll = async () => {
    return await notifications.readAll({ tags, data: dataFilter });
  };

  const seenAll = async () => {
    return await notifications.seenAll({ tags, data: dataFilter });
  };

  const archiveAll = async () => {
    return await notifications.archiveAll({ tags, data: dataFilter });
  };

  const archiveAllRead = async () => {
    return await notifications.archiveAllRead({ tags, data: dataFilter });
  };

  return {
    readAll,
    seenAll,
    archiveAll,
    archiveAllRead,
    notifications: data,
    error,
    isLoading,
    isFetching,
    refetch,
    fetchMore,
    hasMore,
  };
};
