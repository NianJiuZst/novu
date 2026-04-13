import type { Context } from '../../../types';
import { useChannelConnection } from '../../api/hooks/useChannelConnection';
import { useStyle } from '../../helpers/useStyle';
import { Loader } from '../../icons/Loader';
import { Button, Motion } from '../primitives';

export type ConnectChatProps = {
  integrationIdentifier: string;
  connectionIdentifier?: string;
  subscriberId?: string;
  context?: Context;
  scope?: string[];
  onConnectSuccess?: (connectionIdentifier: string) => void;
  onConnectError?: (error: unknown) => void;
  onDisconnectSuccess?: () => void;
  onDisconnectError?: (error: unknown) => void;
};

export const ConnectChat = (props: ConnectChatProps) => {
  const style = useStyle();
  const { connection, loading, connect, disconnect } = useChannelConnection({
    integrationIdentifier: props.integrationIdentifier,
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
    } else {
      const result = await connect({
        integrationIdentifier: props.integrationIdentifier,
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
    <div
      class={style({
        key: 'connectChatContainer',
        className: 'nt-flex nt-items-center nt-gap-2',
      })}
    >
      <Button
        class={style({
          key: 'connectChatButton',
          className: 'nt-transition-[width] nt-duration-800 nt-will-change-[width]',
        })}
        variant="secondary"
        onClick={handleClick}
        disabled={loading()}
      >
        <span
          class={style({
            key: 'connectChatButtonContainer',
            className: 'nt-relative nt-overflow-hidden nt-inline-flex nt-items-center nt-justify-center nt-gap-1',
          })}
        >
          <Motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: loading() ? 0 : 1 }}
            transition={{ easing: 'ease-in-out', duration: 0.2 }}
            class="nt-inline-flex nt-items-center"
          >
            <span
              class={style({
                key: 'connectChatButtonLabel',
                className: '[line-height:16px]',
              })}
            >
              {isConnected() ? 'Disconnect' : 'Connect'}
            </span>
          </Motion.span>
          <Motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: loading() ? 1 : 0 }}
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
