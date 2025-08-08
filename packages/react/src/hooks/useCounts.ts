import { checkNotificationMatchesFilter, isSameFilter, Notification, NotificationFilter, NovuError } from '@novu/js';
import { useCallback, useEffect, useState } from 'react';
import { subscribeLocalStateEvents } from '../utils/realtime';
import { useWebSocketEvent } from './internal/useWebsocketEvent';
import { useNovu } from './NovuProvider';

type Count = {
  count: number;
  filter: NotificationFilter;
};

/**
 * Props for the useCounts hook.
 *
 * @example
 * ```tsx
 * // Count unread notifications
 * const { counts } = useCounts({
 *   filters: [{ read: false }]
 * });
 *
 * // Count unseen notifications with specific tags
 * const { counts } = useCounts({
 *   filters: [{ seen: false, tags: ['important'] }]
 * });
 *
 * // Count seen but unread notifications
 * const { counts } = useCounts({
 *   filters: [{ seen: true, read: false }]
 * });
 * ```
 */
export type UseCountsProps = {
  filters: NotificationFilter[];
  onSuccess?: (data: Count[]) => void;
  onError?: (error: NovuError) => void;
};

export type UseCountsResult = {
  counts?: Count[];
  error?: NovuError;
  isLoading: boolean; // initial loading
  isFetching: boolean; // the request is in flight
  refetch: () => Promise<void>;
};

export const useCounts = (props: UseCountsProps): UseCountsResult => {
  const { filters, onSuccess, onError } = props;
  const { notifications, on } = useNovu();
  const [error, setError] = useState<NovuError>();
  const [counts, setCounts] = useState<Count[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const sync = useCallback(
    async (notification?: Notification) => {
      let countFiltersToFetch: NotificationFilter[] = [];
      if (notification) {
        countFiltersToFetch = filters.filter((filter) => checkNotificationMatchesFilter(notification, filter));
      } else {
        countFiltersToFetch = filters;
      }

      if (countFiltersToFetch.length === 0) {
        return;
      }

      setIsFetching(true);
      const countsRes = await notifications.count({ filters: countFiltersToFetch });
      setIsFetching(false);
      setIsLoading(false);
      if (countsRes.error) {
        setError(countsRes.error);
        onError?.(countsRes.error);

        return;
      }
      const data = countsRes.data;
      if (!data) {
        return;
      }
      onSuccess?.(data.counts);

      setCounts((oldCounts) => {
        const baseline = oldCounts ?? filters.map((filter) => ({ count: 0, filter }));
        const newCounts: Count[] = [];
        const countsReceived = data.counts;

        for (let i = 0; i < baseline.length; i++) {
          const countReceived = countsReceived.find((c) => isSameFilter(c.filter, baseline[i].filter));
          const count = countReceived || oldCounts?.[i];
          if (count) {
            newCounts.push(count);
          }
        }

        return newCounts;
      });
    },
    [filters, notifications, onError, onSuccess]
  );

  useWebSocketEvent({
    event: 'notifications.notification_received',
    eventHandler: (data) => {
      sync(data.result);
    },
  });

  useWebSocketEvent({
    event: 'notifications.unread_count_changed',
    eventHandler: () => {
      sync();
    },
  });

  useWebSocketEvent({
    event: 'notifications.unseen_count_changed',
    eventHandler: () => {
      sync();
    },
  });

  // React to local actions (pending & resolved) to keep counts in sync instantly
  useEffect(() => {
    const cleanup = subscribeLocalStateEvents(
      on as unknown as (event: string, handler: (payload: { data?: Notification }) => void) => () => void,
      ({ data }: { data?: Notification }) => {
        if (data) {
          void sync(data);
        } else {
          void sync();
        }
      }
    );

    return () => {
      cleanup();
    };
  }, [on, sync]);

  useEffect(() => {
    setError(undefined);
    setIsLoading(true);
    setIsFetching(false);
    sync();
  }, [JSON.stringify(filters)]);

  const refetch = async () => {
    await sync();
  };

  return { counts, error, refetch, isLoading, isFetching };
};
