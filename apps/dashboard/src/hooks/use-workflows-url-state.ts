import { DirectionEnum } from '@novu/shared';
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
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

export function useWorkflowsUrlState(): WorkflowsUrlState {
  const [{ query, tags, status, orderBy, orderDirection, offset, limit }, setSearchParams] = useQueryStates({
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

  const filterValues: WorkflowFilters = {
    query,
    tags,
    status,
    orderBy,
    orderDirection,
    offset,
    limit,
  };

  const updateQuery = useCallback(
    (newQuery: string) => {
      setSearchParams({ query: newQuery || null, offset: 0 });
    },
    [setSearchParams]
  );

  const updateTags = useCallback(
    (newTags: string[]) => {
      setSearchParams({ tags: newTags.length > 0 ? newTags : null, offset: 0 });
    },
    [setSearchParams]
  );

  const updateStatus = useCallback(
    (newStatus: string[]) => {
      setSearchParams({ status: newStatus.length > 0 ? newStatus : null, offset: 0 });
    },
    [setSearchParams]
  );

  const updatePagination = useCallback(
    (newOffset: number, newLimit?: number) => {
      const updates: { offset: number; limit?: number } = { offset: newOffset };
      if (newLimit && newLimit !== limit) {
        updates.limit = newLimit;
      }
      setSearchParams(updates);
    },
    [setSearchParams, limit]
  );

  const toggleSort = useCallback(
    (column: SortableColumn) => {
      const newDirection =
        column === orderBy
          ? orderDirection === DirectionEnum.DESC
            ? DirectionEnum.ASC
            : DirectionEnum.DESC
          : DirectionEnum.DESC;

      setSearchParams({ orderBy: column, orderDirection: newDirection, offset: 0 });
    },
    [setSearchParams, orderBy, orderDirection]
  );

  const resetFilters = useCallback(() => {
    setSearchParams({ query: null, tags: null, status: null, offset: 0 });
  }, [setSearchParams]);

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
