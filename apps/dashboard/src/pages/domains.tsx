import { DomainStatusEnum } from '@novu/shared';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { RiAddLine, RiMore2Fill, RiSearchLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import type { DomainResponse } from '@/api/domains';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddDomainDialog } from '@/components/domains/add-domain-dialog';
import { PageMeta } from '@/components/page-meta';
import { Badge } from '@/components/primitives/badge';
import { Button } from '@/components/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { Input } from '@/components/primitives/input';
import { showErrorToast, showSuccessToast } from '@/components/primitives/sonner-helpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/primitives/table';
import { useEnvironment } from '@/context/environment/hooks';
import { useDeleteDomain, useFetchDomains } from '@/hooks/use-domains';
import { buildRoute, ROUTES } from '@/utils/routes';

function DomainStatusBadge({ status }: { status: DomainStatusEnum }) {
  if (status === DomainStatusEnum.VERIFIED) {
    return (
      <Badge variant="light" color="green">
        Verified
      </Badge>
    );
  }

  return (
    <Badge variant="light" color="orange">
      Pending
    </Badge>
  );
}

function DomainRow({ domain, environmentSlug }: { domain: DomainResponse; environmentSlug: string }) {
  const navigate = useNavigate();
  const deleteDomain = useDeleteDomain();

  const handleDelete = async (e: Event) => {
    e.stopPropagation();
    try {
      await deleteDomain.mutateAsync(domain._id);
      showSuccessToast(`Domain "${domain.name}" deleted.`);
    } catch {
      showErrorToast('Failed to delete domain.');
    }
  };

  const handleRowClick = () => {
    navigate(buildRoute(ROUTES.DOMAIN_DETAIL, { environmentSlug, domainId: domain._id }));
  };

  return (
    <TableRow className="hover:bg-neutral-alpha-50 cursor-pointer" onClick={handleRowClick}>
      <TableCell className="font-medium">{domain.name}</TableCell>
      <TableCell>
        <DomainStatusBadge status={domain.status} />
      </TableCell>
      <TableCell className="text-foreground-500 text-sm">
        {formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}
      </TableCell>
      <TableCell className="text-foreground-500 text-sm">
        {formatDistanceToNow(new Date(domain.updatedAt), { addSuffix: true })}
      </TableCell>
      <TableCell className="w-12 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button mode="ghost" variant="secondary" size="xs" className="text-foreground-500 size-8">
              <RiMore2Fill className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={handleDelete}
              disabled={deleteDomain.isPending}
            >
              Delete domain
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function DomainsPage() {
  const { currentEnvironment } = useEnvironment();
  const { data: domains, isLoading } = useFetchDomains();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filtered = (domains ?? []).filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <PageMeta title="Domains" />
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h1 className="text-xl font-semibold">Domains</h1>
        </div>

        <div className="flex items-center gap-3 px-6 py-4">
          <div className="relative flex-1 max-w-xs">
            <RiSearchLine className="text-foreground-400 absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <RiAddLine className="size-4" />
            Add domain
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          <Table isLoading={isLoading} loadingRowsCount={3}>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            {!isLoading && (
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-foreground-400 py-16 text-center">
                      {search
                        ? 'No domains match your search.'
                        : 'No domains yet. Add your first domain to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((domain) => (
                    <DomainRow key={domain._id} domain={domain} environmentSlug={currentEnvironment?.slug ?? ''} />
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </div>
      </div>

      <AddDomainDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </DashboardLayout>
  );
}
