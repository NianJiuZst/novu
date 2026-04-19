import { DomainRouteTypeEnum } from '@novu/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RiAddLine, RiMore2Fill, RiRobot2Line, RiWebhookLine } from 'react-icons/ri';
import { listAgents } from '@/api/agents';
import type { DomainResponse, DomainRouteResponse } from '@/api/domains';
import { Button } from '@/components/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { Input } from '@/components/primitives/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { showErrorToast } from '@/components/primitives/sonner-helpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/primitives/table';
import { useEnvironment } from '@/context/environment/hooks';
import { useCreateRoute, useDeleteRoute, useUpdateRoute } from '@/hooks/use-domain-routes';
import { RoutingEmptyIllustration } from './routing-empty-illustration';

type RouteFormState = {
  address: string;
  destination: string;
  type: DomainRouteTypeEnum;
};

const DEFAULT_ROUTE_FORM: RouteFormState = {
  address: '',
  destination: '',
  type: DomainRouteTypeEnum.AGENT,
};

type DomainRoutingProps = {
  domain: DomainResponse;
};

function useAgents() {
  const { currentEnvironment } = useEnvironment();

  return useQuery({
    queryKey: ['fetchAgents', currentEnvironment?._id],
    queryFn: () =>
      listAgents({
        // biome-ignore lint/style/noNonNullAssertion: enabled guard ensures currentEnvironment is defined
        environment: currentEnvironment!,
        limit: 50,
      }),
    enabled: !!currentEnvironment,
    select: (data) => data.data,
  });
}

function RouteTypeBadge({ type }: { type: DomainRouteTypeEnum }) {
  if (type === DomainRouteTypeEnum.AGENT) {
    return (
      <span className="text-foreground-600 flex items-center gap-1 text-sm">
        <RiRobot2Line className="size-4" />
        Agent
      </span>
    );
  }

  return (
    <span className="text-foreground-600 flex items-center gap-1 text-sm">
      <RiWebhookLine className="size-4" />
      Webhook
    </span>
  );
}

type InlineRouteFormProps = {
  domainName: string;
  initialValues?: RouteFormState;
  agentOptions: Array<{ _id: string; name: string; identifier: string }>;
  onSave: (values: RouteFormState) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
};

function InlineRouteForm({
  domainName,
  initialValues = DEFAULT_ROUTE_FORM,
  agentOptions,
  onSave,
  onCancel,
  isSaving,
}: InlineRouteFormProps) {
  const [form, setForm] = useState<RouteFormState>(initialValues);

  const handleSave = async () => {
    if (!form.address.trim() || !form.destination.trim()) {
      showErrorToast('Address and destination are required.');
      return;
    }
    await onSave(form);
  };

  return (
    <TableRow>
      {/* Address */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            className="h-7 w-28 text-sm"
            placeholder="support"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <span className="text-foreground-400 shrink-0 text-xs">@inbound.{domainName}</span>
        </div>
      </TableCell>

      {/* Destination */}
      <TableCell>
        {form.type === DomainRouteTypeEnum.AGENT ? (
          <Select value={form.destination} onValueChange={(v) => setForm((f) => ({ ...f, destination: v }))}>
            <SelectTrigger className="h-7 w-56 text-sm" size="2xs">
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              {agentOptions.map((agent) => (
                <SelectItem key={agent._id} value={agent._id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            className="h-7 w-56 text-sm"
            placeholder="https://api.example.com/webhooks"
            value={form.destination}
            onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
          />
        )}
      </TableCell>

      {/* Type */}
      <TableCell>
        <Select
          value={form.type}
          onValueChange={(v) => setForm((f) => ({ ...f, type: v as DomainRouteTypeEnum, destination: '' }))}
        >
          <SelectTrigger className="h-7 w-28 text-sm" size="2xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DomainRouteTypeEnum.AGENT}>Agent</SelectItem>
            <SelectItem value={DomainRouteTypeEnum.WEBHOOK}>Webhook</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      {/* Status placeholder */}
      <TableCell />

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            mode="ghost"
            variant="secondary"
            className="size-7 text-success"
            onClick={handleSave}
            disabled={isSaving}
          >
            ✓
          </Button>
          <Button size="xs" mode="ghost" variant="secondary" className="text-destructive size-7" onClick={onCancel}>
            ✕
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

type ExistingRouteRowProps = {
  route: DomainRouteResponse;
  routeIndex: number;
  domainName: string;
  agentOptions: Array<{ _id: string; name: string; identifier: string }>;
  onDelete: (index: number) => Promise<void>;
  onEdit: (index: number) => void;
  isDeleting: boolean;
};

function ExistingRouteRow({
  route,
  routeIndex,
  domainName,
  agentOptions,
  onDelete,
  onEdit,
  isDeleting,
}: ExistingRouteRowProps) {
  const agentName =
    route.type === DomainRouteTypeEnum.AGENT
      ? (agentOptions.find((a) => a._id === route.destination)?.name ?? route.destination)
      : route.destination;

  return (
    <TableRow>
      <TableCell className="text-sm">
        {route.address}@{domainName}
      </TableCell>
      <TableCell className="text-foreground-600 max-w-[200px] truncate text-sm">{agentName}</TableCell>
      <TableCell>
        <RouteTypeBadge type={route.type} />
      </TableCell>
      <TableCell>
        <span className="text-success text-sm">Active</span>
      </TableCell>
      <TableCell className="w-12 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button mode="ghost" variant="secondary" size="xs" className="text-foreground-500 size-8">
              <RiMore2Fill className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(routeIndex)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onDelete(routeIndex)}
              disabled={isDeleting}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function DomainRouting({ domain }: DomainRoutingProps) {
  const { data: agents = [] } = useAgents();
  const createRoute = useCreateRoute(domain._id);
  const updateRoute = useUpdateRoute(domain._id);
  const deleteRoute = useDeleteRoute(domain._id);

  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleCreate = async (values: RouteFormState) => {
    try {
      await createRoute.mutateAsync(values);
      setIsAdding(false);
    } catch {
      showErrorToast('Failed to add route.');
    }
  };

  const handleUpdate = async (index: number, values: RouteFormState) => {
    try {
      await updateRoute.mutateAsync({ routeIndex: index, body: values });
      setEditingIndex(null);
    } catch {
      showErrorToast('Failed to update route.');
    }
  };

  const handleDelete = async (index: number) => {
    try {
      await deleteRoute.mutateAsync(index);
    } catch {
      showErrorToast('Failed to delete route.');
    }
  };

  const agentOptions = agents.map((a) => ({ _id: a._id, name: a.name, identifier: a.identifier }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground-900 text-sm font-semibold uppercase tracking-wide">Routing</h2>
        <Button
          size="sm"
          mode="outline"
          variant="secondary"
          onClick={() => {
            setIsAdding(true);
            setEditingIndex(null);
          }}
        >
          <RiAddLine className="size-4" />
          Add new route
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {domain.routes.map((route, index) =>
              editingIndex === index ? (
                <InlineRouteForm
                  key={index}
                  domainName={domain.name}
                  initialValues={{ address: route.address, destination: route.destination, type: route.type }}
                  agentOptions={agentOptions}
                  onSave={(values) => handleUpdate(index, values)}
                  onCancel={() => setEditingIndex(null)}
                  isSaving={updateRoute.isPending}
                />
              ) : (
                <ExistingRouteRow
                  key={index}
                  route={route}
                  routeIndex={index}
                  domainName={domain.name}
                  agentOptions={agentOptions}
                  onDelete={handleDelete}
                  onEdit={setEditingIndex}
                  isDeleting={deleteRoute.isPending}
                />
              )
            )}

            {isAdding && (
              <InlineRouteForm
                domainName={domain.name}
                agentOptions={agentOptions}
                onSave={handleCreate}
                onCancel={() => setIsAdding(false)}
                isSaving={createRoute.isPending}
              />
            )}

            {domain.routes.length === 0 && !isAdding && (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <RoutingEmptyIllustration />
                    <div className="space-y-1 text-center">
                      <p className="text-foreground-600 text-sm font-medium">No routes configured</p>
                      <p className="text-foreground-400 text-xs">
                        Configure routes to route the incoming emails to relevant agents and webhooks.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      mode="outline"
                      variant="secondary"
                      className="mx-auto"
                      onClick={() => setIsAdding(true)}
                    >
                      <RiAddLine className="size-4" />
                      Add new route
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
