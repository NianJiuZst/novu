import { ListWorkflowResponse } from '@novu/shared';
import { RiMore2Fill } from 'react-icons/ri';
import { useLocation } from 'react-router-dom';
import { DefaultPagination } from '@/components/default-pagination';
import { Skeleton } from '@/components/primitives/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableHeadSortDirection,
  TableRow,
} from '@/components/primitives/table';
import { WorkflowListEmpty } from '@/components/workflow-list-empty';
import { WorkflowRow } from '@/components/workflow-row';
import { ServerErrorPage } from '@/pages/server-error-page';

export type SortableColumn = 'name' | 'updatedAt' | 'lastTriggeredAt';

interface WorkflowListProps {
  data?: ListWorkflowResponse;
  isLoading?: boolean;
  isError?: boolean;
  limit?: number;
  orderBy?: SortableColumn;
  orderDirection?: TableHeadSortDirection;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  toggleSort?: (column: SortableColumn) => void;
}

interface WorkflowListSkeletonProps {
  limit: number;
}

function WorkflowListSkeleton({ limit }: WorkflowListSkeletonProps) {
  return (
    <>
      {new Array(limit).fill(0).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="flex flex-col gap-1 font-medium">
            <Skeleton className="h-5 w-[20ch]" />
            <Skeleton className="h-3 w-[15ch] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[6ch] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[8ch] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[7ch] rounded-full" />
          </TableCell>
          <TableCell className="text-foreground-600 text-sm font-medium">
            <Skeleton className="h-5 w-[14ch] rounded-full" />
          </TableCell>
          <TableCell className="text-foreground-600 text-sm font-medium">
            <Skeleton className="h-5 w-[14ch] rounded-full" />
          </TableCell>
          <TableCell className="text-foreground-600 text-sm font-medium">
            <RiMore2Fill className="size-4 opacity-50" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function WorkflowList({
  data,
  isLoading,
  isError,
  limit = 12,
  orderBy,
  orderDirection,
  hasActiveFilters,
  onClearFilters,
  toggleSort,
}: WorkflowListProps) {
  const location = useLocation();

  const hrefFromOffset = (offset: number) => {
    // Get current search params and update offset
    const currentParams = new URLSearchParams(location.search);
    currentParams.set('offset', offset.toString());
    return `${location.pathname}?${currentParams.toString()}`;
  };

  // Extract offset from current URL for pagination display
  const currentParams = new URLSearchParams(location.search);
  const offset = parseInt(currentParams.get('offset') || '0');

  if (isError) return <ServerErrorPage />;

  if (!isLoading && data?.totalCount === 0) {
    return <WorkflowListEmpty emptySearchResults={hasActiveFilters} onClearFilters={onClearFilters} />;
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil((data?.totalCount || 0) / limit);

  return (
    <div className="flex h-full flex-col">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              sortable
              sortDirection={orderBy === 'name' ? orderDirection : false}
              onSort={() => toggleSort?.('name')}
            >
              Workflows
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Steps</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead
              sortable
              sortDirection={orderBy === 'lastTriggeredAt' ? orderDirection : false}
              onSort={() => toggleSort?.('lastTriggeredAt')}
            >
              Last triggered
            </TableHead>
            <TableHead
              sortable
              sortDirection={orderBy === 'updatedAt' ? orderDirection : false}
              onSort={() => toggleSort?.('updatedAt')}
            >
              Last updated
            </TableHead>

            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <WorkflowListSkeleton limit={limit} />
          ) : (
            <>
              {data?.workflows.map((workflow) => (
                <WorkflowRow key={workflow._id} workflow={workflow} />
              ))}
            </>
          )}
        </TableBody>
        {data && limit < data.totalCount && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>
                <div className="flex items-center justify-between">
                  {data ? (
                    <span className="text-foreground-600 block text-sm font-normal">
                      Page {currentPage} of {totalPages}
                    </span>
                  ) : (
                    <Skeleton className="h-5 w-[20ch]" />
                  )}
                  {data ? (
                    <DefaultPagination
                      hrefFromOffset={hrefFromOffset}
                      totalCount={data.totalCount}
                      limit={limit}
                      offset={offset}
                    />
                  ) : (
                    <Skeleton className="h-5 w-32" />
                  )}
                </div>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
