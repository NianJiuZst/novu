import { useId, useState } from 'react';
import { RiAddCircleLine, RiDeleteBin2Line, RiFileCopyLine, RiMore2Fill, RiRobot2Line } from 'react-icons/ri';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type AgentDto, createAgent, deleteAgent } from '@/api/agents';
import { NovuApiError } from '@/api/api.client';
import { AnimatedOutlet } from '@/components/animated-outlet';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageMeta } from '@/components/page-meta';
import { Button } from '@/components/primitives/button';
import { CompactButton } from '@/components/primitives/button-compact';
import { CopyButton } from '@/components/primitives/copy-button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { Input } from '@/components/primitives/input';
import { Label } from '@/components/primitives/label';
import { Skeleton } from '@/components/primitives/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/primitives/table';
import { TimeDisplayHoverCard } from '@/components/time-display-hover-card';
import { useEnvironment } from '@/context/environment/hooks';
import { useFetchAgents } from '@/hooks/use-fetch-agents';
import { formatDateSimple } from '@/utils/format-date';
import { QueryKeys } from '@/utils/query-keys';
import { buildRoute, ROUTES } from '@/utils/routes';
import { showErrorToast } from '@/components/primitives/sonner-helpers';

function AgentRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-36" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-32" />
      </TableCell>
      <TableCell className="w-1">
        <RiMore2Fill className="size-4 opacity-50" />
      </TableCell>
    </TableRow>
  );
}

function AgentRow({ agent }: { agent: AgentDto }) {
  const { currentEnvironment } = useEnvironment();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const environmentSlug = currentEnvironment?.slug ?? '';

  const agentLink = agent._id
    ? buildRoute(ROUTES.AGENT_OVERVIEW, { environmentSlug, agentId: agent._id })
    : '#';

  async function handleDelete() {
    if (!agent._id || !currentEnvironment) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAgent({ agentId: agent._id, environment: currentEnvironment });
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchAgents], exact: false, refetchType: 'all' });
    } catch {
      showErrorToast('Failed to delete agent');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <TableRow className="group relative isolate cursor-pointer">
        <TableCell className="group-hover:bg-neutral-alpha-50 text-text-sub relative">
          <Link to={agentLink} className="absolute inset-0" tabIndex={-1}>
            <span className="sr-only">View agent</span>
          </Link>
          <div className="flex items-center gap-2">
            <RiRobot2Line className="text-foreground-400 size-4" />
            <span className="max-w-[300px] truncate font-medium">{agent.name}</span>
          </div>
        </TableCell>
        <TableCell className="group-hover:bg-neutral-alpha-50 text-text-sub relative">
          <Link to={agentLink} className="absolute inset-0" tabIndex={-1}>
            <span className="sr-only">View agent</span>
          </Link>
          <div className="flex items-center gap-1">
            <span className="font-code text-text-soft max-w-[300px] truncate">{agent.identifier}</span>
            <CopyButton
              className="z-10 flex size-2 p-0 px-1 opacity-0 group-hover:opacity-100"
              valueToCopy={agent.identifier}
              size="2xs"
            />
          </div>
        </TableCell>
        <TableCell className="group-hover:bg-neutral-alpha-50 text-text-sub relative">
          <Link to={agentLink} className="absolute inset-0" tabIndex={-1}>
            <span className="sr-only">View agent</span>
          </Link>
          {agent.createdAt && (
            <TimeDisplayHoverCard date={agent.createdAt}>{formatDateSimple(agent.createdAt)}</TimeDisplayHoverCard>
          )}
        </TableCell>
        <TableCell className="group-hover:bg-neutral-alpha-50 text-text-sub relative">
          <Link to={agentLink} className="absolute inset-0" tabIndex={-1}>
            <span className="sr-only">View agent</span>
          </Link>
          {agent.updatedAt && (
            <TimeDisplayHoverCard date={agent.updatedAt}>{formatDateSimple(agent.updatedAt)}</TimeDisplayHoverCard>
          )}
        </TableCell>
        <TableCell className="group-hover:bg-neutral-alpha-50 w-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <CompactButton icon={RiMore2Fill} variant="ghost" className="z-10 h-8 w-8 p-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(agent.identifier)}
                >
                  <RiFileCopyLine />
                  Copy identifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => setTimeout(() => setIsDeleteOpen(true), 0)}
                >
                  <RiDeleteBin2Line />
                  Delete agent
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <ConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete agent"
        description={
          <span>
            Are you sure you want to delete agent <span className="font-bold">{agent.name}</span>? This action cannot be
            undone.
          </span>
        }
        confirmButtonText="Delete agent"
        isLoading={isDeleting}
      />
    </>
  );
}

function AgentsBlankState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <RiRobot2Line className="size-8 text-neutral-600" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-text-sub text-label-md block font-medium">No agents created yet</span>
        <p className="text-text-soft text-paragraph-sm max-w-[60ch]">
          Agents represent AI-powered assistants in your application. Create an agent to get started with configuring its
          behavior and integrations.
        </p>
      </div>
    </div>
  );
}

export function AgentsPage() {
  const { environmentSlug } = useParams<{ environmentSlug: string }>();
  const navigate = useNavigate();
  const { currentEnvironment } = useEnvironment();
  const queryClient = useQueryClient();
  const agentsQuery = useFetchAgents();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const nameFieldId = useId();
  const identifierFieldId = useId();

  const createMutation = useMutation({
    mutationFn: () => {
      const environment = currentEnvironment;

      if (!environment) {
        throw new Error('No environment');
      }

      return createAgent({
        environment,
        body: {
          name: name.trim(),
          ...(identifier.trim() ? { identifier: identifier.trim() } : {}),
        },
      });
    },
    onSuccess: async (agent) => {
      setCreateError(null);
      setCreateOpen(false);
      setName('');
      setIdentifier('');
      await queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchAgents, currentEnvironment?._id] });

      if (environmentSlug && agent._id) {
        navigate(buildRoute(ROUTES.AGENT_OVERVIEW, { environmentSlug, agentId: agent._id }));
      }
    },
    onError: (err: unknown) => {
      if (err instanceof NovuApiError) {
        setCreateError(err.message);

        return;
      }

      setCreateError('Something went wrong');
    },
  });

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !currentEnvironment) {
      return;
    }

    setCreateError(null);
    createMutation.mutate();
  }

  const hasData = !!agentsQuery.data?.length;
  const isLoading = agentsQuery.isLoading;
  const showBlank = !isLoading && !hasData;

  return (
    <>
      <PageMeta title="Agents" />
      <DashboardLayout
        headerStartItems={<h1 className="text-foreground-950 flex items-center gap-1">Agents</h1>}
      >
        <div className={`flex h-full flex-col ${showBlank ? 'h-[calc(100vh-100px)]' : ''}`}>
          <div className="flex items-center justify-between py-2.5">
            <div />
            <Button
              variant="primary"
              mode="gradient"
              size="xs"
              leadingIcon={RiAddCircleLine}
              onClick={() => setCreateOpen(true)}
            >
              Create Agent
            </Button>
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Created at</TableHead>
                  <TableHead>Updated at</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <AgentRowSkeleton key={i} />
                ))}
              </TableBody>
            </Table>
          ) : showBlank ? (
            <AgentsBlankState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Created at</TableHead>
                  <TableHead>Updated at</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(agentsQuery.data ?? []).map((agent) => (
                  <AgentRow key={agent._id} agent={agent} />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>Create agent</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={nameFieldId}>Name</Label>
                  <Input
                    id={nameFieldId}
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    placeholder="Support bot"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={identifierFieldId}>Identifier (optional)</Label>
                  <Input
                    id={identifierFieldId}
                    value={identifier}
                    onChange={(ev) => setIdentifier(ev.target.value)}
                    placeholder="support-bot"
                  />
                </div>
                {createError ? <p className="text-destructive text-sm">{createError}</p> : null}
              </div>
              <DialogFooter>
                <Button type="button" mode="outline" variant="secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" mode="gradient" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AnimatedOutlet />
      </DashboardLayout>
    </>
  );
}
