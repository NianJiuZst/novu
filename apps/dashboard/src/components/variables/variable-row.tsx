import { IEnvironment, PermissionsEnum } from '@novu/shared';
import React, { useState } from 'react';
import {
  RiAlertLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiCornerDownRightLine,
  RiDeleteBin2Line,
  RiMore2Fill,
} from 'react-icons/ri';
import type { EnvironmentVariableResponseDto } from '@/api/environment-variables';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { CompactButton } from '@/components/primitives/button-compact';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { EnvironmentBranchIcon } from '@/components/primitives/environment-branch-icon';
import { Skeleton } from '@/components/primitives/skeleton';
import { TableCell, TableRow } from '@/components/primitives/table';
import { TimeDisplayHoverCard } from '@/components/time-display-hover-card';
import { useDeleteEnvironmentVariable } from '@/hooks/use-delete-environment-variable';
import { formatDateSimple } from '@/utils/format-date';
import { Protect } from '@/utils/protect';
import { cn } from '@/utils/ui';

const SECRET_MASK = '••••••••';

type VariableRowProps = {
  variable: EnvironmentVariableResponseDto;
  currentEnvironment?: IEnvironment;
  environments?: IEnvironment[];
};

type CellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

const VariableCell = ({ children, className, ...rest }: CellProps) => (
  <TableCell className={cn('group-hover/row:bg-neutral-alpha-50 text-text-sub relative', className)} {...rest}>
    {children}
  </TableCell>
);

function CoverageBadge({ filledCount, totalCount }: { filledCount: number; totalCount: number }) {
  const isFull = filledCount === totalCount;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium',
        isFull ? 'bg-success/10 text-success-600' : 'bg-warning/10 text-warning-600'
      )}
    >
      {isFull ? <RiCheckLine className="size-3" /> : <RiAlertLine className="size-3" />}
      {filledCount}/{totalCount}
      {!isFull && ' SET'}
    </span>
  );
}

function EnvironmentSubRow({
  variable,
  environment,
}: {
  variable: EnvironmentVariableResponseDto;
  environment: IEnvironment;
}) {
  const envValue = variable.values.find((v) => v._environmentId === environment._id);
  const displayValue = variable.isSecret && envValue?.value ? SECRET_MASK : (envValue?.value ?? '');

  return (
    <TableRow className="bg-neutral-alpha-25 hover:bg-neutral-alpha-50">
      <TableCell className="pl-8">
        <div className="flex items-center gap-2">
          <RiCornerDownRightLine className="text-text-disabled size-4 shrink-0" />
          <EnvironmentBranchIcon environment={environment} size="sm" />
          <span className="text-text-sub text-xs font-medium">{environment.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {envValue ? (
          <span className="font-code text-text-strong text-xs">{displayValue}</span>
        ) : (
          <span className="text-text-disabled text-xs italic">No value set</span>
        )}
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell />
    </TableRow>
  );
}

export const VariableRow = ({ variable, currentEnvironment, environments = [] }: VariableRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { deleteEnvironmentVariable, isPending: isDeleting } = useDeleteEnvironmentVariable();

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const currentEnvValue = variable.values.find((v) => v._environmentId === currentEnvironment?._id);
  const displayCurrentValue =
    variable.isSecret && currentEnvValue?.value ? SECRET_MASK : (currentEnvValue?.value ?? '');

  const filledCount = variable.values.filter((v) => v.value).length;
  const totalCount = environments.length;

  const handleDelete = async () => {
    await deleteEnvironmentVariable({ variableId: variable._id });
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <TableRow className="group/row relative isolate cursor-pointer" onClick={() => setIsExpanded((prev) => !prev)}>
        <VariableCell>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <RiArrowDownSLine className="text-text-sub size-4 shrink-0" />
            ) : (
              <RiArrowRightSLine className="text-text-sub size-4 shrink-0" />
            )}
            <span className="font-code text-text-strong text-sm font-medium">{variable.key}</span>
            {variable.isSecret && (
              <span className="bg-feature/10 text-feature rounded px-1.5 py-0.5 text-xs font-medium">Secret</span>
            )}
          </div>
        </VariableCell>
        <VariableCell>
          <div className="flex items-center gap-2">
            {currentEnvValue?.value ? (
              <span className="font-code text-text-strong text-sm">{displayCurrentValue}</span>
            ) : (
              <span className="text-text-soft text-sm italic">No value</span>
            )}
            {totalCount > 0 && <CoverageBadge filledCount={filledCount} totalCount={totalCount} />}
          </div>
        </VariableCell>
        <VariableCell>
          <span className="text-text-soft text-sm">–</span>
        </VariableCell>
        <VariableCell>
          {variable.updatedAt && (
            <TimeDisplayHoverCard date={variable.updatedAt}>
              {formatDateSimple(variable.updatedAt)}
            </TimeDisplayHoverCard>
          )}
        </VariableCell>
        <VariableCell className="w-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <CompactButton
                icon={RiMore2Fill}
                variant="ghost"
                className="z-10 h-8 w-8 p-0"
                onClick={stopPropagation}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" onClick={stopPropagation}>
              <DropdownMenuGroup>
                <Protect permission={PermissionsEnum.ORG_SETTINGS_WRITE}>
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={() => setTimeout(() => setIsDeleteModalOpen(true), 0)}
                  >
                    <RiDeleteBin2Line />
                    Delete variable
                  </DropdownMenuItem>
                </Protect>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </VariableCell>
      </TableRow>
      {isExpanded &&
        environments.map((env) => <EnvironmentSubRow key={env._id} variable={variable} environment={env} />)}
      <ConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
        title="Delete variable"
        description={
          <span>
            Are you sure you want to delete <span className="font-bold">{variable.key}</span>? This action cannot be
            undone.
          </span>
        }
        confirmButtonText="Delete variable"
        isLoading={isDeleting}
      />
    </>
  );
};

export const VariableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-5 w-40" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-5 w-32" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-5 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-5 w-28" />
    </TableCell>
    <TableCell className="w-1">
      <RiMore2Fill className="size-4 opacity-30" />
    </TableCell>
  </TableRow>
);
