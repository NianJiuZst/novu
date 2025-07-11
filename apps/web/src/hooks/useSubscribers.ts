import type { ISubscriber } from '@novu/shared';
import { useQuery } from '@tanstack/react-query';
import { getSubscribersList } from '../api/subscribers';
import { useEnvironment } from './useEnvironment';

export function useSubscribers(page = 0, limit = 10) {
  const { environment } = useEnvironment();
  const { data, isLoading } = useQuery<{ data: ISubscriber[]; hasMore: boolean; pageSize: number }>(
    ['subscribersList', environment?._id, page, limit],
    () => getSubscribersList(page, limit),
    {
      keepPreviousData: true,
    }
  );

  return {
    subscribers: data?.data,
    loading: isLoading,
    pageSize: data?.pageSize,
    hasMore: data?.hasMore,
  };
}
