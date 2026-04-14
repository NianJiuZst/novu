import { createSignal, onCleanup, Show } from 'solid-js';
import type { Context } from '../../../types';
import { useChannelConnection } from '../../api/hooks/useChannelConnection';
import { useNovu } from '../../context';
import { useStyle } from '../../helpers/useStyle';
import { CheckCircleFill } from '../../icons/CheckCircleFill';
import { Loader } from '../../icons/Loader';
import { SlackColored } from '../../icons/SlackColored';
import { Button, Motion } from '../primitives';
import { IconRendererWrapper } from '../shared/IconRendererWrapper';
import { DEFAULT_CONNECTION_IDENTIFIER, DEFAULT_INTEGRATION_IDENTIFIER } from '../slack-constants';

export type SlackConnectButtonProps = {
  integrationIdentifier?: string;
  connectionIdentifier?: string;
  subscriberId?: string;
  context?: Context;
  scope?: string[];
  onConnectSuccess?: (connectionIdentifier: string) => void;
  onConnectError?: (error: unknown) => void;
  onDisconnectSuccess?: () => void;
  onDisconnectError?: (error: unknown) => void;
  connectLabel?: string;
  connectedLabel?: string;
};

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120_000;

export const SlackConnectButton = (props: SlackConnectButtonProps) => {
  const style = useStyle();
  const novuAccessor = useNovu();
  const integrationIdentifier = () => props.integrationIdentifier ?? DEFAULT_INTEGRATION_IDENTIFIER;
  const connectionIdentifier = () => props.connectionIdentifier ?? DEFAULT_CONNECTION_IDENTIFIER;

  const { connection, loading, connect, disconnect, mutate } = useChannelConnection({
    integrationIdentifier: integrationIdentifier(),
    connectionIdentifier: connectionIdentifier(),
    subscriberId: props.subscriberId,
  });

  const [actionLoading, setActionLoading] = createSignal(false);

  const isConnected = () => !!connection();
  const isLoading = () => loading() || actionLoading();

  const startPolling = () => {
    const startedAt = Date.now();

    const intervalId = setInterval(async () => {
      try {
        const response = await novuAccessor().channelConnections.get({
          identifier: connectionIdentifier(),
        });

        if (response.data) {
          clearInterval(intervalId);
          setActionLoading(false);
          mutate(response.data);
          props.onConnectSuccess?.(connectionIdentifier());

          return;
        }
      } catch {
        // ignore transient errors during polling
      }

      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        clearInterval(intervalId);
        setActionLoading(false);
        props.onConnectError?.(new Error('Slack OAuth timed out. Please try again.'));
      }
    }, POLL_INTERVAL_MS);

    onCleanup(() => clearInterval(intervalId));
  };

  const handleClick = async () => {
    if (isConnected()) {
      const identifier = connection()?.identifier;
      if (!identifier) return;

      const result = await disconnect(identifier);
      if (result.error) {
        props.onDisconnectError?.(result.error);
      } else {
        props.onDisconnectSuccess?.();
      }
    } else {
      setActionLoading(true);

      const result = await connect({
        integrationIdentifier: integrationIdentifier(),
        connectionIdentifier: connectionIdentifier(),
        subscriberId: props.subscriberId,
        context: props.context,
        scope: props.scope,
      });

      if (result.error) {
        setActionLoading(false);
        props.onConnectError?.(result.error);

        return;
      }

      if (result.data?.url) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
        startPolling();
      }
    }
  };

  return (
    <Show when={!loading()} fallback={<Loader class="nt-text-foreground-alpha-600 nt-size-4 nt-animate-spin" />}>
      <div
        class={style({
          key: 'slackConnectButtonContainer',
          className: 'nt-flex nt-items-center nt-gap-2',
        })}
      >
        <Button
          class={style({
            key: 'slackConnectButton',
            className: 'nt-transition-[width] nt-duration-800 nt-will-change-[width]',
          })}
          variant="secondary"
          onClick={handleClick}
          disabled={isLoading()}
        >
          <span
            class={style({
              key: 'slackConnectButtonInner',
              className: 'nt-relative nt-overflow-hidden nt-inline-flex nt-items-center nt-justify-center nt-gap-1',
            })}
          >
            <Motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: actionLoading() ? 0 : 1 }}
              transition={{ easing: 'ease-in-out', duration: 0.2 }}
              class="nt-inline-flex nt-items-center nt-gap-1"
            >
              {isConnected() ? (
                <IconRendererWrapper
                  iconKey="slackConnected"
                  class={style({
                    key: 'slackConnectButtonIcon',
                    className:
                      'nt-inline-flex nt-items-center nt-justify-center nt-size-4 nt-shrink-0 nt-rounded-full nt-bg-white nt-shadow-[0_1px_2px_0_rgba(10,13,20,0.03)]',
                    iconKey: 'slackConnected',
                  })}
                  fallback={
                    <span
                      class={style({
                        key: 'slackConnectButtonIcon',
                        className:
                          'nt-inline-flex nt-items-center nt-justify-center nt-size-4 nt-shrink-0 nt-rounded-full nt-bg-white nt-shadow-[0_1px_2px_0_rgba(10,13,20,0.03)]',
                        iconKey: 'slackConnected',
                      })}
                    >
                      <CheckCircleFill class="nt-size-full" />
                    </span>
                  }
                />
              ) : (
                <IconRendererWrapper
                  iconKey="slackConnect"
                  class={style({
                    key: 'slackConnectButtonIcon',
                    className: 'nt-size-4 nt-shrink-0',
                    iconKey: 'slackConnect',
                  })}
                  fallback={
                    <SlackColored
                      class={style({
                        key: 'slackConnectButtonIcon',
                        className: 'nt-size-4 nt-shrink-0',
                        iconKey: 'slackConnect',
                      })}
                    />
                  }
                />
              )}
              <span
                class={style({
                  key: 'slackConnectButtonLabel',
                  className: '[line-height:16px]',
                })}
              >
                {isConnected() ? (props.connectedLabel ?? 'Connected') : (props.connectLabel ?? 'Connect Slack')}
              </span>
            </Motion.span>
            <Motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: actionLoading() ? 1 : 0 }}
              transition={{ easing: 'ease-in-out', duration: 0.2 }}
              class="nt-absolute nt-left-0 nt-inline-flex nt-items-center"
            >
              <Loader class="nt-text-foreground-alpha-600 nt-size-3.5 nt-animate-spin" />
            </Motion.span>
          </span>
        </Button>
      </div>
    </Show>
  );
};
