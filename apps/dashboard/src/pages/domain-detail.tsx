import { DomainStatusEnum } from '@novu/shared';
import { formatDistanceToNow } from 'date-fns';
import { RiMore2Fill, RiRefreshLine, RiShieldCheckLine } from 'react-icons/ri';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { DomainRouting } from '@/components/domains/domain-routing';
import { PageMeta } from '@/components/page-meta';
import { Badge } from '@/components/primitives/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/primitives/breadcrumb';
import { Button } from '@/components/primitives/button';
import { CompactButton } from '@/components/primitives/button-compact';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { InlineToast } from '@/components/primitives/inline-toast';
import { Separator } from '@/components/primitives/separator';
import { Skeleton } from '@/components/primitives/skeleton';
import { showErrorToast, showSuccessToast } from '@/components/primitives/sonner-helpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/primitives/table';
import { useEnvironment } from '@/context/environment/hooks';
import { useFetchDomain, useRefreshDomain } from '@/hooks/use-domain';
import { useDeleteDomain } from '@/hooks/use-domains';
import { buildRoute, ROUTES } from '@/utils/routes';

function DomainStatusBadge({ status }: { status: DomainStatusEnum }) {
  if (status === DomainStatusEnum.VERIFIED) {
    return (
      <Badge variant="light" color="green">
        <RiShieldCheckLine className="mr-1 size-3" />
        Verified
      </Badge>
    );
  }

  return (
    <Badge variant="light" color="orange">
      Pending verified
    </Badge>
  );
}

function MxRecordStatusBadge({ configured }: { configured: boolean }) {
  if (configured) {
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

export function DomainDetailPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const { currentEnvironment } = useEnvironment();
  const navigate = useNavigate();

  const { data: domain, isLoading, isFetching } = useFetchDomain(domainId);
  const { refresh: refreshDomain } = useRefreshDomain(domainId);
  const deleteDomain = useDeleteDomain();

  const domainsHref = currentEnvironment?.slug
    ? buildRoute(ROUTES.DOMAINS, { environmentSlug: currentEnvironment.slug })
    : ROUTES.DOMAINS;

  const handleVerify = () => {
    refreshDomain();
    showSuccessToast('Verification status refreshed.');
  };

  const handleDelete = async () => {
    if (!domain) return;
    try {
      await deleteDomain.mutateAsync(domain._id);
      showSuccessToast(`Domain "${domain.name}" deleted.`);
      navigate(domainsHref);
    } catch {
      showErrorToast('Failed to delete domain.');
    }
  };

  return (
    <DashboardLayout>
      <PageMeta title={domain?.name ?? 'Domain'} />

      <div className="flex h-full flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to={domainsHref}>Domains</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{isLoading ? <Skeleton className="h-4 w-24" /> : (domain?.name ?? '')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            {isLoading ? <Skeleton className="h-6 w-40" /> : <h1 className="text-xl font-semibold">{domain?.name}</h1>}
            {!isLoading && domain && (
              <p className="text-foreground-400 mt-0.5 text-sm">
                Created {formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              mode="outline"
              variant="secondary"
              size="sm"
              onClick={handleVerify}
              disabled={isFetching || isLoading}
            >
              <RiRefreshLine className="size-4" />
              Retry verification
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <CompactButton icon={RiMore2Fill} variant="stroke" className="h-8 w-8 p-0" />
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
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
            {/* Pending warning */}
            {!isLoading && domain?.status === DomainStatusEnum.PENDING && (
              <InlineToast
                variant="warning"
                title="Warning:"
                description="Domain isn't fully verified yet. Emails won't be received until MX records are configured."
              />
            )}

            {/* Two column layout: metadata + DNS records */}
            <div className="flex gap-8">
              {/* Left: metadata */}
              <div className="w-56 shrink-0 space-y-4">
                <MetaRow label="Status">
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : domain ? (
                    <DomainStatusBadge status={domain.status} />
                  ) : null}
                </MetaRow>
                <MetaRow label="Domain">
                  {isLoading ? <Skeleton className="h-4 w-32" /> : <span className="text-sm">{domain?.name}</span>}
                </MetaRow>
                <MetaRow label="Created on">
                  {isLoading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : domain ? (
                    <span className="text-sm">
                      {new Date(domain.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  ) : null}
                </MetaRow>
                <MetaRow label="Last updated">
                  {isLoading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : domain ? (
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(domain.updatedAt), { addSuffix: true })}
                    </span>
                  ) : null}
                </MetaRow>
              </div>

              {/* Right: DNS records */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-foreground-900 text-sm font-semibold uppercase tracking-wide">DNS Records</h2>
                  <button
                    className="text-foreground-500 hover:text-foreground-900 flex items-center gap-1 text-xs transition-colors"
                    onClick={handleVerify}
                    disabled={isFetching}
                    type="button"
                  >
                    <RiRefreshLine className="size-3" />
                    Refresh status
                  </button>
                </div>

                <div className="rounded-lg border">
                  <div className="border-b px-4 py-3">
                    <p className="text-foreground-700 text-sm font-medium">
                      Receiving emails <span className="text-foreground-400 font-normal">(MX)</span>
                    </p>
                    <p className="text-foreground-400 mt-1 text-xs">Update your DNS records to match the following:</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Content</TableHead>
                        <TableHead className="text-xs">TTL</TableHead>
                        <TableHead className="text-xs">Priority</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ) : domain?.expectedDnsRecords?.length ? (
                        domain.expectedDnsRecords.map((record, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-mono">{record.type}</TableCell>
                            <TableCell className="text-sm font-mono">{record.name}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm font-mono">{record.content}</TableCell>
                            <TableCell className="text-sm">{record.ttl}</TableCell>
                            <TableCell className="text-sm">{record.priority}</TableCell>
                            <TableCell>
                              <MxRecordStatusBadge configured={domain.mxRecordConfigured} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-foreground-400 text-center text-sm">
                            No DNS records available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <Separator />

            {/* Routing section */}
            {domain && <DomainRouting domain={domain} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-foreground-400 text-xs">{label}</p>
      <div className="text-foreground-900">{children}</div>
    </div>
  );
}
