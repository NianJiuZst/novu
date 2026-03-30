import { useId, useState } from 'react';
import {
  RiAddLine,
  RiArrowLeftLine,
  RiCloseLine,
  RiDeleteBin2Line,
  RiPencilLine,
  RiPlugLine,
  RiRobot2Line,
} from 'react-icons/ri';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { providers as novuProviders } from '@novu/shared';
import { deleteAgent, type AgentDto, updateAgent } from '@/api/agents';
import { NovuApiError } from '@/api/api.client';
import { ProviderIcon } from '@/components/integrations/components/provider-icon';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageMeta } from '@/components/page-meta';
import { Badge } from '@/components/primitives/badge';
import { Button } from '@/components/primitives/button';
import { Checkbox } from '@/components/primitives/checkbox';
import { CopyButton } from '@/components/primitives/copy-button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/dialog';
import { Input } from '@/components/primitives/input';
import { Label } from '@/components/primitives/label';
import { Separator } from '@/components/primitives/separator';
import { Skeleton } from '@/components/primitives/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/primitives/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/tabs';
import { TimeDisplayHoverCard } from '@/components/time-display-hover-card';
import { showErrorToast } from '@/components/primitives/sonner-helpers';
import { useEnvironment } from '@/context/environment/hooks';
import { useFetchAgent } from '@/hooks/use-fetch-agent';
import { useFetchIntegrations } from '@/hooks/use-fetch-integrations';
import { CHANNEL_TYPE_TO_STRING } from '@/utils/channels';
import { formatDateSimple } from '@/utils/format-date';
import { buildRoute, ROUTES } from '@/utils/routes';
import { QueryKeys } from '@/utils/query-keys';

function AgentOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <Separator />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>
    </div>
  );
}

function AgentIntegrationsTabPanel({
  agent,
  isAgentLoading,
  agentId,
}: {
  agent: AgentDto | undefined;
  isAgentLoading: boolean;
  agentId: string | undefined;
}) {
  const { currentEnvironment } = useEnvironment();
  const queryClient = useQueryClient();
  const { integrations, isLoading: isIntegrationsLoading } = useFetchIntegrations();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const integrationMutation = useMutation({
    mutationFn: (integrationIds: string[]) => {
      if (!currentEnvironment || !agentId) {
        throw new Error('Missing environment or agent');
      }

      return updateAgent({
        agentId,
        environment: currentEnvironment,
        body: { integrationIds },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchAgent, currentEnvironment?._id, agentId] });
      await queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchAgents, currentEnvironment?._id] });
      setAddOpen(false);
      setSelectedToAdd(new Set());
    },
    onError: () => {
      showErrorToast('Failed to update agent integrations');
    },
  });

  if (isAgentLoading || !agent) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const integrationIds = agent.integrationIds ?? [];
  const envIntegrations = (integrations ?? []).filter(
    (i) => i._environmentId === currentEnvironment?._id && !i.deleted
  );

  const assignedRows = integrationIds.map((id) => ({
    id,
    integration: envIntegrations.find((x) => x._id === id),
  }));

  const unassignedIntegrations = envIntegrations.filter((i) => !integrationIds.includes(i._id));

  function toggleSelectedToAdd(integrationId: string, checked: boolean) {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);

      if (checked) {
        next.add(integrationId);
      } else {
        next.delete(integrationId);
      }

      return next;
    });
  }

  function handleConfirmAdd() {
    const next = [...integrationIds, ...Array.from(selectedToAdd)];

    integrationMutation.mutate(next);
  }

  function handleRemove(integrationId: string) {
    integrationMutation.mutate(integrationIds.filter((x) => x !== integrationId));
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-foreground-400 text-xs font-medium uppercase tracking-wider">Connected integrations</span>
          <p className="text-foreground-600 max-w-[60ch] text-sm">
            Choose which integrations this agent can use. Only integrations in this environment are available.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          mode="outline"
          size="xs"
          leadingIcon={RiAddLine}
          onClick={() => setAddOpen(true)}
          disabled={isIntegrationsLoading || unassignedIntegrations.length === 0}
        >
          Add integration
        </Button>
      </div>

      {isIntegrationsLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : assignedRows.length === 0 ? (
        <div className="border-neutral-alpha-200 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <RiPlugLine className="size-6 text-neutral-600" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-foreground-900 font-medium">No integrations assigned</h3>
            <p className="text-foreground-400 max-w-[40ch] text-sm">
              Add integrations from this environment so the agent can use them.
            </p>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Integration</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedRows.map(({ id, integration }) => {
              const provider = integration
                ? novuProviders.find((p) => p.id === integration.providerId)
                : undefined;

              return (
                <TableRow key={id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {provider && integration ? (
                        <ProviderIcon providerId={provider.id} providerDisplayName={provider.displayName} />
                      ) : (
                        <div className="bg-neutral-alpha-100 flex h-6 w-6 items-center justify-center rounded text-xs">
                          ?
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{integration?.name ?? 'Unknown integration'}</span>
                        <span className="text-foreground-400 font-code truncate text-xs">{id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {integration ? (
                      <Badge variant="lighter" size="sm">
                        {CHANNEL_TYPE_TO_STRING[integration.channel]}
                      </Badge>
                    ) : (
                      <Badge variant="lighter" size="sm">
                        —
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="secondary"
                      mode="outline"
                      size="2xs"
                      leadingIcon={RiCloseLine}
                      onClick={() => handleRemove(id)}
                      disabled={integrationMutation.isPending}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);

          if (open) {
            setSelectedToAdd(new Set());
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add integrations</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[min(60vh,420px)] flex-col gap-2 overflow-y-auto py-2">
            {unassignedIntegrations.length === 0 ? (
              <p className="text-foreground-500 text-sm">No more integrations available for this environment.</p>
            ) : (
              unassignedIntegrations.map((integration) => {
                const provider = novuProviders.find((p) => p.id === integration.providerId);

                return (
                  <label
                    key={integration._id}
                    htmlFor={`add-int-${integration._id}`}
                    className="hover:bg-neutral-alpha-50 flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-2"
                  >
                    <Checkbox
                      id={`add-int-${integration._id}`}
                      checked={selectedToAdd.has(integration._id)}
                      onCheckedChange={(checked) => toggleSelectedToAdd(integration._id, checked === true)}
                    />
                    {provider ? (
                      <ProviderIcon providerId={provider.id} providerDisplayName={provider.displayName} />
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{integration.name}</span>
                      <span className="text-foreground-400 text-xs">
                        {CHANNEL_TYPE_TO_STRING[integration.channel]}
                        {provider ? ` · ${provider.displayName}` : ''}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button type="button" mode="outline" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              mode="gradient"
              disabled={selectedToAdd.size === 0 || integrationMutation.isPending}
              onClick={handleConfirmAdd}
            >
              {integrationMutation.isPending ? 'Saving…' : 'Add selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AgentConfigPage() {
  const { environmentSlug, agentId } = useParams<{ environmentSlug: string; agentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentEnvironment } = useEnvironment();
  const queryClient = useQueryClient();
  const agentQuery = useFetchAgent(agentId);

  const currentTab = location.pathname.endsWith('/integrations') ? 'integrations' : 'overview';

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIdentifier, setEditIdentifier] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const editNameFieldId = useId();
  const editIdentifierFieldId = useId();

  const updateMutation = useMutation({
    mutationFn: () => {
      const environment = currentEnvironment;
      const id = agentId;

      if (!environment || !id) {
        throw new Error('Missing environment or agent');
      }

      return updateAgent({
        agentId: id,
        environment,
        body: {
          name: editName.trim(),
          identifier: editIdentifier.trim(),
        },
      });
    },
    onSuccess: async () => {
      setEditError(null);
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchAgent, currentEnvironment?._id, agentId] });
      await queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchAgents, currentEnvironment?._id] });
    },
    onError: (err: unknown) => {
      if (err instanceof NovuApiError) {
        setEditError(err.message);

        return;
      }

      setEditError('Something went wrong');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      const environment = currentEnvironment;
      const id = agentId;

      if (!environment || !id) {
        throw new Error('Missing environment or agent');
      }

      return deleteAgent({ agentId: id, environment });
    },
    onSuccess: async () => {
      setDeleteOpen(false);
      await queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchAgents, currentEnvironment?._id] });

      if (environmentSlug) {
        navigate(buildRoute(ROUTES.AGENTS, { environmentSlug }));
      }
    },
  });

  function handleTabChange(value: string) {
    if (!environmentSlug || !agentId) {
      return;
    }

    if (value === 'integrations') {
      navigate(buildRoute(ROUTES.AGENT_INTEGRATIONS, { environmentSlug, agentId }));

      return;
    }

    navigate(buildRoute(ROUTES.AGENT_OVERVIEW, { environmentSlug, agentId }));
  }

  function openEdit() {
    const agent = agentQuery.data;

    if (!agent) {
      return;
    }

    setEditName(agent.name);
    setEditIdentifier(agent.identifier);
    setEditError(null);
    setEditOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!editName.trim() || !editIdentifier.trim()) {
      return;
    }

    setEditError(null);
    updateMutation.mutate();
  }

  const agent = agentQuery.data;
  const listHref = environmentSlug ? buildRoute(ROUTES.AGENTS, { environmentSlug }) : '/';

  const headerItems = (
    <div className="flex items-center gap-2">
      <Link
        to={listHref}
        className="text-foreground-600 hover:text-foreground-950 flex items-center gap-1 text-sm transition-colors"
      >
        <RiArrowLeftLine className="size-4" />
        Agents
      </Link>
      <span className="text-foreground-300">/</span>
      <h1 className="text-foreground-950 truncate">
        {agentQuery.isLoading ? <Skeleton className="inline-block h-5 w-32" /> : (agent?.name ?? 'Agent')}
      </h1>
    </div>
  );

  if (agentQuery.isError) {
    return (
      <>
        <PageMeta title="Agent" />
        <DashboardLayout headerStartItems={headerItems}>
          <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <RiRobot2Line className="size-6 text-neutral-600" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-foreground-900 font-medium">Agent not found</h3>
              <p className="text-foreground-400 text-sm">
                This agent may have been deleted or you may not have permission to view it.
              </p>
            </div>
            <Button variant="secondary" mode="outline" size="xs" onClick={() => navigate(listHref)}>
              Back to agents
            </Button>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <PageMeta title={agent?.name ?? 'Agent'} />
      <DashboardLayout headerStartItems={headerItems}>
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <div className="border-neutral-alpha-200 flex items-center justify-between border-b">
            <TabsList variant="regular" className="border-b-0 border-t-2 border-transparent p-0 px-2!">
              <TabsTrigger value="overview" variant="regular" size="xl">
                Overview
              </TabsTrigger>
              <TabsTrigger value="integrations" variant="regular" size="xl">
                Integrations
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0!">
            {agentQuery.isLoading || !agent ? (
              <AgentOverviewSkeleton />
            ) : (
              <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-foreground-400 text-xs font-medium uppercase tracking-wider">Agent Name</span>
                    <span className="text-foreground-950 text-xl font-semibold">{agent.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      mode="outline"
                      size="xs"
                      leadingIcon={RiPencilLine}
                      onClick={openEdit}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="error"
                      mode="outline"
                      size="xs"
                      leadingIcon={RiDeleteBin2Line}
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-foreground-400 text-xs font-medium uppercase tracking-wider">Identifier</span>
                    <div className="flex items-center gap-1">
                      <span className="font-code text-foreground-950 text-sm">{agent.identifier}</span>
                      <CopyButton valueToCopy={agent.identifier} size="2xs" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-foreground-400 text-xs font-medium uppercase tracking-wider">ID</span>
                    <div className="flex items-center gap-1">
                      <span className="font-code text-foreground-950 text-sm">{agent._id ?? '—'}</span>
                      {agent._id && <CopyButton valueToCopy={agent._id} size="2xs" />}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-foreground-400 text-xs font-medium uppercase tracking-wider">Created</span>
                    <span className="text-foreground-950 text-sm">
                      {agent.createdAt ? (
                        <TimeDisplayHoverCard date={agent.createdAt}>
                          {formatDateSimple(agent.createdAt)}
                        </TimeDisplayHoverCard>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-foreground-400 text-xs font-medium uppercase tracking-wider">Updated</span>
                    <span className="text-foreground-950 text-sm">
                      {agent.updatedAt ? (
                        <TimeDisplayHoverCard date={agent.updatedAt}>
                          {formatDateSimple(agent.updatedAt)}
                        </TimeDisplayHoverCard>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="integrations" className="mt-0!">
            <AgentIntegrationsTabPanel
              agent={agent}
              isAgentLoading={agentQuery.isLoading}
              agentId={agentId}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit agent</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={editNameFieldId}>Name</Label>
                  <Input
                    id={editNameFieldId}
                    value={editName}
                    onChange={(ev) => setEditName(ev.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={editIdentifierFieldId}>Identifier</Label>
                  <Input
                    id={editIdentifierFieldId}
                    value={editIdentifier}
                    onChange={(ev) => setEditIdentifier(ev.target.value)}
                    required
                  />
                </div>
                {editError ? <p className="text-destructive text-sm">{editError}</p> : null}
              </div>
              <DialogFooter>
                <Button type="button" mode="outline" variant="secondary" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" mode="gradient" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmationModal
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete agent"
          description={
            <span>
              Are you sure you want to delete <span className="font-bold">{agent?.name}</span>? This action cannot be
              undone.
            </span>
          }
          confirmButtonText="Delete agent"
          confirmButtonVariant="error"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
        />
      </DashboardLayout>
    </>
  );
}
