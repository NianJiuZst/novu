import { LinkUserProps } from '@novu/js/ui';
import { useCallback } from 'react';
import { useNovuUI } from '../../context/NovuUIContext';
import { Mounter } from '../Mounter';

export type DefaultLinkUserProps = Pick<
  LinkUserProps,
  | 'integrationIdentifier'
  | 'connectionIdentifier'
  | 'subscriberId'
  | 'slackUserId'
  | 'endpointIdentifier'
  | 'context'
  | 'onLinkSuccess'
  | 'onLinkError'
  | 'onUnlinkSuccess'
  | 'onUnlinkError'
>;

export const DefaultLinkUser = (props: DefaultLinkUserProps) => {
  const {
    integrationIdentifier,
    connectionIdentifier,
    subscriberId,
    slackUserId,
    endpointIdentifier,
    context,
    onLinkSuccess,
    onLinkError,
    onUnlinkSuccess,
    onUnlinkError,
  } = props;
  const { novuUI } = useNovuUI();

  const mount = useCallback(
    (element: HTMLElement) => {
      return novuUI.mountComponent({
        name: 'LinkUser',
        props: {
          integrationIdentifier,
          connectionIdentifier,
          subscriberId,
          slackUserId,
          endpointIdentifier,
          context,
          onLinkSuccess,
          onLinkError,
          onUnlinkSuccess,
          onUnlinkError,
        },
        element,
      });
    },
    [
      novuUI,
      integrationIdentifier,
      connectionIdentifier,
      subscriberId,
      slackUserId,
      endpointIdentifier,
      context,
      onLinkSuccess,
      onLinkError,
      onUnlinkSuccess,
      onUnlinkError,
    ]
  );

  return <Mounter mount={mount} />;
};
