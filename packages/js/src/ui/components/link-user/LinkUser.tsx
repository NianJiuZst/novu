import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import type {
  ChannelEndpointResponse,
  CreateChannelEndpointArgs,
  DeleteChannelEndpointArgs,
} from '../../../channel-connections/types';
import type { Context } from '../../../types';
import { useNovu } from '../../context';
import { useStyle } from '../../helpers/useStyle';
import { Loader } from '../../icons/Loader';
import { Button, Motion } from '../primitives';

export type LinkUserProps = {
  integrationIdentifier: string;
  connectionIdentifier?: string;
  subscriberId: string;
  type: string;
  endpoint: Record<string, string>;
  endpointIdentifier?: string;
  context?: Context;
  /** Pre-computed context keys (e.g. from a previous response) used to scope the endpoint list when
   * looking up an existing endpoint for deduplication. Corresponds to the `contextKeys` filter on
   * the list endpoint. Pass this alongside `context` when the context keys are already known. */
  contextKeys?: string[];
  onLinkSuccess?: (endpoint: { identifier: string }) => void;
  onLinkError?: (error: unknown) => void;
  onUnlinkSuccess?: () => void;
  onUnlinkError?: (error: unknown) => void;
};

const endpointMatches = (ep: ChannelEndpointResponse, type: string, endpoint: Record<string, string>): boolean => {
  if (ep.type !== type) return false;
  const epEndpoint = ep.endpoint as Record<string, string>;

  return Object.keys(endpoint).every((key) => epEndpoint[key] === endpoint[key]);
};

export const LinkUser = (props: LinkUserProps) => {
  const style = useStyle();
  const novuAccessor = useNovu();

  const [endpoint, setEndpoint] = createSignal<ChannelEndpointResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [actionLoading, setActionLoading] = createSignal(false);

  const isLinked = () => !!endpoint();
  const isLoading = () => loading() || actionLoading();

  // On mount, find an existing endpoint: prefer endpointIdentifier prop, then discover by
  // listing endpoints and matching type + endpoint for idempotency.
  createResource(
    () => ({
      endpointIdentifier: props.endpointIdentifier,
      integrationIdentifier: props.integrationIdentifier,
      contextKeys: props.contextKeys,
      type: props.type,
      endpoint: props.endpoint,
    }),
    async ({
      endpointIdentifier,
      integrationIdentifier,
      contextKeys,
      type,
      endpoint,
    }: {
      endpointIdentifier: string | undefined;
      integrationIdentifier: string;
      contextKeys: string[] | undefined;
      type: string;
      endpoint: Record<string, string>;
    }) => {
      setLoading(true);

      try {
        if (endpointIdentifier) {
          const response = await novuAccessor().channelEndpoints.get({ identifier: endpointIdentifier });
          setEndpoint(response.data ?? null);
        } else {
          // Discover whether an endpoint already exists for this type+endpoint combination
          // to avoid creating duplicates. Pass contextKeys when provided so the search is
          // scoped to the same context.
          const response = await novuAccessor().channelEndpoints.list({ integrationIdentifier, contextKeys });
          const existing = response.data?.find((ep: ChannelEndpointResponse) => endpointMatches(ep, type, endpoint));
          setEndpoint(existing ?? null);
        }
      } catch {
        setEndpoint(null);
      } finally {
        setLoading(false);
      }
    }
  );

  onMount(() => {
    const currentNovu = novuAccessor();

    const cleanupCreateResolved = currentNovu.on(
      'channel-endpoint.create.resolved',
      ({ data }: { args: CreateChannelEndpointArgs; data?: ChannelEndpointResponse; error?: unknown }) => {
        if (data && endpointMatches(data, props.type, props.endpoint)) {
          setEndpoint(data);
        }
      }
    );

    const cleanupDeleteResolved = currentNovu.on(
      'channel-endpoint.delete.resolved',
      ({ args }: { args: DeleteChannelEndpointArgs; data?: undefined; error?: unknown }) => {
        if (args?.identifier && args.identifier === endpoint()?.identifier) {
          setEndpoint(null);
        }
      }
    );

    onCleanup(() => {
      cleanupCreateResolved();
      cleanupDeleteResolved();
    });
  });

  const handleClick = async () => {
    if (isLinked()) {
      const identifier = endpoint()?.identifier;
      if (!identifier) return;

      setActionLoading(true);
      const result = await novuAccessor().channelEndpoints.delete({ identifier });
      setActionLoading(false);

      if (result.error) {
        props.onUnlinkError?.(result.error);
      } else {
        setEndpoint(null);
        props.onUnlinkSuccess?.();
      }
    } else {
      setActionLoading(true);
      const result = await novuAccessor().channelEndpoints.create({
        integrationIdentifier: props.integrationIdentifier,
        connectionIdentifier: props.connectionIdentifier,
        subscriberId: props.subscriberId,
        context: props.context,
        type: props.type,
        endpoint: props.endpoint,
      });
      setActionLoading(false);

      if (result.error) {
        props.onLinkError?.(result.error);
      } else if (result.data) {
        setEndpoint(result.data);
        props.onLinkSuccess?.({ identifier: result.data.identifier });
      }
    }
  };

  return (
    <div
      class={style({
        key: 'linkUserContainer',
        className: 'nt-flex nt-items-center nt-gap-2',
      })}
    >
      <Button
        class={style({
          key: 'linkUserButton',
          className: 'nt-transition-[width] nt-duration-800 nt-will-change-[width]',
        })}
        variant="secondary"
        onClick={handleClick}
        disabled={isLoading()}
      >
        <span
          class={style({
            key: 'linkUserButtonContainer',
            className: 'nt-relative nt-overflow-hidden nt-inline-flex nt-items-center nt-justify-center nt-gap-1',
          })}
        >
          <Motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: isLoading() ? 0 : 1 }}
            transition={{ easing: 'ease-in-out', duration: 0.2 }}
            class="nt-inline-flex nt-items-center"
          >
            <span
              class={style({
                key: 'linkUserButtonLabel',
                className: '[line-height:16px]',
              })}
            >
              {isLinked() ? 'Connected' : 'Connect your Slack account'}
            </span>
          </Motion.span>
          <Motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: isLoading() ? 1 : 0 }}
            transition={{ easing: 'ease-in-out', duration: 0.2 }}
            class="nt-absolute nt-left-0 nt-inline-flex nt-items-center"
          >
            <Loader class="nt-text-foreground-alpha-600 nt-size-3.5 nt-animate-spin" />
          </Motion.span>
        </span>
      </Button>
    </div>
  );
};
