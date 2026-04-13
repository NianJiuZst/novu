import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import type { ChannelEndpointResponse } from '../../../channel-connections/types';
import type { Context } from '../../../types';
import { useNovu } from '../../context';
import { useStyle } from '../../helpers/useStyle';
import { Loader } from '../../icons/Loader';
import { Button, Motion } from '../primitives';

export type LinkSlackUserProps = {
  integrationIdentifier: string;
  connectionIdentifier: string;
  subscriberId?: string;
  context?: Context;
  onLinkSuccess?: (endpoint: { identifier: string }) => void;
  onLinkError?: (error: unknown) => void;
  onUnlinkSuccess?: () => void;
  onUnlinkError?: (error: unknown) => void;
  linkLabel?: string;
  unlinkLabel?: string;
};

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120_000;

export const LinkSlackUser = (props: LinkSlackUserProps) => {
  const style = useStyle();
  const novuAccessor = useNovu();

  const [endpoint, setEndpoint] = createSignal<ChannelEndpointResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [actionLoading, setActionLoading] = createSignal(false);

  const isLinked = () => !!endpoint();
  const isLoading = () => loading() || actionLoading();

  createResource(
    () => ({
      integrationIdentifier: props.integrationIdentifier,
      connectionIdentifier: props.connectionIdentifier,
    }),
    async ({ integrationIdentifier, connectionIdentifier }) => {
      setLoading(true);

      try {
        const response = await novuAccessor().channelEndpoints.list({ integrationIdentifier, connectionIdentifier });
        const existing = response.data?.find((ep) => ep.type === 'slack_user') ?? null;
        setEndpoint(existing);
      } catch {
        setEndpoint(null);
      } finally {
        setLoading(false);
      }
    }
  );

  onMount(() => {
    const currentNovu = novuAccessor();

    const cleanupDelete = currentNovu.on('channel-endpoint.delete.resolved', ({ args }) => {
      if (args?.identifier && args.identifier === endpoint()?.identifier) {
        setEndpoint(null);
      }
    });

    return () => {
      cleanupDelete();
    };
  });

  const startPolling = () => {
    const startedAt = Date.now();

    const intervalId = setInterval(async () => {
      try {
        const response = await novuAccessor().channelEndpoints.list({
          integrationIdentifier: props.integrationIdentifier,
          connectionIdentifier: props.connectionIdentifier,
        });
        const found = response.data?.find((ep) => ep.type === 'slack_user') ?? null;

        if (found) {
          clearInterval(intervalId);
          setActionLoading(false);
          setEndpoint(found);
          props.onLinkSuccess?.({ identifier: found.identifier });

          return;
        }
      } catch {
        // ignore transient errors during polling
      }

      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        clearInterval(intervalId);
        setActionLoading(false);
        props.onLinkError?.(new Error('Slack OAuth timed out. Please try again.'));
      }
    }, POLL_INTERVAL_MS);

    onCleanup(() => clearInterval(intervalId));
  };

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

      const result = await novuAccessor().channelConnections.generateOAuthUrl({
        integrationIdentifier: props.integrationIdentifier,
        connectionIdentifier: props.connectionIdentifier,
        subscriberId: props.subscriberId ?? novuAccessor().subscriberId,
        context: props.context,
        mode: 'link_user',
        userScope: ['identity.basic'],
      });

      if (result.error) {
        setActionLoading(false);
        props.onLinkError?.(result.error);

        return;
      }

      if (result.data?.url) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
        startPolling();
      }
    }
  };

  return (
    <div
      class={style({
        key: 'linkSlackUserContainer',
        className: 'nt-flex nt-items-center nt-gap-2',
      })}
    >
      <Button
        class={style({
          key: 'linkSlackUserButton',
          className: 'nt-transition-[width] nt-duration-800 nt-will-change-[width]',
        })}
        variant="secondary"
        onClick={handleClick}
        disabled={isLoading()}
      >
        <span
          class={style({
            key: 'linkSlackUserButtonContainer',
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
                key: 'linkSlackUserButtonLabel',
                className: '[line-height:16px]',
              })}
            >
              {isLinked() ? (props.unlinkLabel ?? 'Unlink') : (props.linkLabel ?? 'Link User')}
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
