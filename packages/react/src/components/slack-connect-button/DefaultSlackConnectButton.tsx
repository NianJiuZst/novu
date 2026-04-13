import { SlackConnectButtonProps } from '@novu/js/ui';
import { useCallback } from 'react';
import { useNovuUI } from '../../context/NovuUIContext';
import { Mounter } from '../Mounter';

export type DefaultSlackConnectButtonProps = Pick<
  SlackConnectButtonProps,
  | 'integrationIdentifier'
  | 'connectionIdentifier'
  | 'subscriberId'
  | 'context'
  | 'scope'
  | 'onConnectSuccess'
  | 'onConnectError'
  | 'onDisconnectSuccess'
  | 'onDisconnectError'
>;

export const DefaultSlackConnectButton = (props: DefaultSlackConnectButtonProps) => {
  const {
    integrationIdentifier,
    connectionIdentifier,
    subscriberId,
    context,
    scope,
    onConnectSuccess,
    onConnectError,
    onDisconnectSuccess,
    onDisconnectError,
  } = props;
  const { novuUI } = useNovuUI();

  const mount = useCallback(
    (element: HTMLElement) => {
      return novuUI.mountComponent({
        name: 'SlackConnectButton',
        props: {
          integrationIdentifier,
          connectionIdentifier,
          subscriberId,
          context,
          scope,
          onConnectSuccess,
          onConnectError,
          onDisconnectSuccess,
          onDisconnectError,
        },
        element,
      });
    },
    [
      novuUI,
      integrationIdentifier,
      connectionIdentifier,
      subscriberId,
      context,
      scope,
      onConnectSuccess,
      onConnectError,
      onDisconnectSuccess,
      onDisconnectError,
    ]
  );

  return <Mounter mount={mount} />;
};
