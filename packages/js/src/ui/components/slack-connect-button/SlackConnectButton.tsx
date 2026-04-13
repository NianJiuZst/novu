import { Show } from 'solid-js';
import type { Context } from '../../../types';
import { useChannelConnection } from '../../api/hooks/useChannelConnection';
import { useStyle } from '../../helpers/useStyle';
import { CheckCircleFill } from '../../icons/CheckCircleFill';
import { Loader } from '../../icons/Loader';
import { SlackColored } from '../../icons/SlackColored';
import { Button } from '../primitives';

export type SlackConnectButtonProps = {
  integrationIdentifier?: string;
  connectionIdentifier?: string;
  subscriberId?: string;
  context?: Context;
  scope?: string[];
  endpointType?: string;
  endpointData?: Record<string, string>;
  onConnectSuccess?: (connectionIdentifier: string) => void;
  onConnectError?: (error: unknown) => void;
  onDisconnectSuccess?: () => void;
  onDisconnectError?: (error: unknown) => void;
};

const DEFAULT_INTEGRATION_IDENTIFIER = 'slack';

export const SlackConnectButton = (props: SlackConnectButtonProps) => {
  const style = useStyle();
  const integrationIdentifier = () => props.integrationIdentifier ?? DEFAULT_INTEGRATION_IDENTIFIER;

  const { connection, loading, connect, connectAndLink, disconnect } = useChannelConnection({
    integrationIdentifier: integrationIdentifier(),
    connectionIdentifier: props.connectionIdentifier,
    subscriberId: props.subscriberId,
  });

  const isConnected = () => !!connection();

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
    } else if (props.endpointType && props.endpointData) {
      const result = await connectAndLink({
        integrationIdentifier: integrationIdentifier(),
        connectionIdentifier: props.connectionIdentifier,
        subscriberId: props.subscriberId,
        context: props.context,
        scope: props.scope,
        endpointType: props.endpointType,
        endpointData: props.endpointData,
      });

      if (result.error) {
        props.onConnectError?.(result.error);
      } else if (result.data?.url) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
        if (props.connectionIdentifier) {
          props.onConnectSuccess?.(props.connectionIdentifier);
        }
      }
    } else {
      const result = await connect({
        integrationIdentifier: integrationIdentifier(),
        connectionIdentifier: props.connectionIdentifier,
        subscriberId: props.subscriberId,
        context: props.context,
        scope: props.scope,
      });

      if (result.error) {
        props.onConnectError?.(result.error);
      } else if (result.data?.url) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
        if (props.connectionIdentifier) {
          props.onConnectSuccess?.(props.connectionIdentifier);
        }
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
        >
          <span
            class={style({
              key: 'slackConnectButtonInner',
              className: 'nt-relative nt-overflow-hidden nt-inline-flex nt-items-center nt-justify-center nt-gap-1',
            })}
          >
            {isConnected() ? (
              <span
                class={style({
                  key: 'slackConnectButtonIcon',
                  className:
                    'nt-inline-flex nt-items-center nt-justify-center nt-size-4 nt-shrink-0 nt-rounded-full nt-bg-white nt-shadow-[0_1px_2px_0_rgba(10,13,20,0.03)]',
                })}
              >
                <CheckCircleFill class="nt-size-full" />
              </span>
            ) : (
              <SlackColored
                class={style({
                  key: 'slackConnectButtonIcon',
                  className: 'nt-size-4 nt-shrink-0',
                })}
              />
            )}
            <span
              class={style({
                key: 'slackConnectButtonLabel',
                className: '[line-height:16px]',
              })}
            >
              {isConnected() ? 'Connected' : 'Connect Slack'}
            </span>
          </span>
        </Button>
      </div>
    </Show>
  );
};
