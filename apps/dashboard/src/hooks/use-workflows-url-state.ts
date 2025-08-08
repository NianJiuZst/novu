import { DirectionEnum } from '@novu/shared';
import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs';
import { useCallback } from 'react';
import { SortableColumn } from '@/components/workflow-list';

export interface WorkflowFilters {
  query: string;
  tags: string[];
  status: string[];
  orderBy: SortableColumn;
  orderDirection: DirectionEnum;
  offset: number;
  limit: number;
}

export interface WorkflowsUrlState {
  filterValues: WorkflowFilters;
  updateQuery: (query: string) => void;
  updateTags: (tags: string[]) => void;
  updateStatus: (status: string[]) => void;
  updatePagination: (offset: number, limit?: number) => void;
  toggleSort: (column: SortableColumn) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const searchParamsCache = createSearchParamsCache({
  query: parseAsString.withDefault(''),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  orderBy: parseAsStringEnum<SortableColumn>(['name', 'updatedAt', 'lastTriggeredAt']).withDefault('updatedAt'),
  orderDirection: parseAsStringEnum<DirectionEnum>([DirectionEnum.ASC, DirectionEnum.DESC]).withDefault(
    DirectionEnum.DESC
  ),
  offset: parseAsInteger.withDefault(0),
  limit: parseAsInteger.withDefault(12),
});

export function useWorkflowsUrlState(): WorkflowsUrlState {
  const { query, tags, status, orderBy, orderDirection, offset, limit } = searchParamsCache.all();

  const filterValues: WorkflowFilters = {
    query,
    tags,
    status,
    orderBy,
    orderDirection,
    offset,
    limit,
  };

  const updateQuery = useCallback((newQuery: string) => {
    searchParamsCache.set('query', newQuery || null);
    searchParamsCache.set('offset', 0);
  }, []);

  const updateTags = useCallback((newTags: string[]) => {
    searchParamsCache.set('tags', newTags.length > 0 ? newTags : null);
    searchParamsCache.set('offset', 0);
  }, []);

  const updateStatus = useCallback((newStatus: string[]) => {
    searchParamsCache.set('status', newStatus.length > 0 ? newStatus : null);
    searchParamsCache.set('offset', 0);
  }, []);

  const updatePagination = useCallback(
    (newOffset: number, newLimit?: number) => {
      searchParamsCache.set('offset', newOffset);
      if (newLimit && newLimit !== limit) {
        searchParamsCache.set('limit', newLimit);
      }
    },
    [limit]
  );

  const toggleSort = useCallback(
    (column: SortableColumn) => {
      const newDirection =
        column === orderBy
          ? orderDirection === DirectionEnum.DESC
            ? DirectionEnum.ASC
            : DirectionEnum.DESC
          : DirectionEnum.DESC;

      searchParamsCache.set('orderBy', column);
      searchParamsCache.set('orderDirection', newDirection);
      searchParamsCache.set('offset', 0);
    },
    [orderBy, orderDirection]
  );

  const resetFilters = useCallback(() => {
    searchParamsCache.set('query', null);
    searchParamsCache.set('tags', null);
    searchParamsCache.set('status', null);
    searchParamsCache.set('offset', 0);
  }, []);

  const hasActiveFilters = query.trim() !== '' || tags.length > 0 || status.length > 0;

  return {
    filterValues,
    updateQuery,
    updateTags,
    updateStatus,
    updatePagination,
    toggleSort,
    resetFilters,
    hasActiveFilters,
  };
}
