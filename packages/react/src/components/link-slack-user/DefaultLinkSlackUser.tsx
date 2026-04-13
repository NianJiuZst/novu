import { LinkSlackUserProps } from '@novu/js/ui';
import { useCallback } from 'react';
import { useNovuUI } from '../../context/NovuUIContext';
import { Mounter } from '../Mounter';

export type DefaultLinkSlackUserProps = Pick<
  LinkSlackUserProps,
  | 'integrationIdentifier'
  | 'connectionIdentifier'
  | 'subscriberId'
  | 'context'
  | 'onLinkSuccess'
  | 'onLinkError'
  | 'onUnlinkSuccess'
  | 'onUnlinkError'
  | 'linkLabel'
  | 'unlinkLabel'
>;

export const DefaultLinkSlackUser = (props: DefaultLinkSlackUserProps) => {
  const {
    integrationIdentifier,
    connectionIdentifier,
    subscriberId,
    context,
    onLinkSuccess,
    onLinkError,
    onUnlinkSuccess,
    onUnlinkError,
    linkLabel,
    unlinkLabel,
  } = props;
  const { novuUI } = useNovuUI();

  const mount = useCallback(
    (element: HTMLElement) => {
      return novuUI.mountComponent({
        name: 'LinkSlackUser',
        props: {
          integrationIdentifier,
          connectionIdentifier,
          subscriberId,
          context,
          onLinkSuccess,
          onLinkError,
          onUnlinkSuccess,
          onUnlinkError,
          linkLabel,
          unlinkLabel,
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
      onLinkSuccess,
      onLinkError,
      onUnlinkSuccess,
      onUnlinkError,
      linkLabel,
      unlinkLabel,
    ]
  );

  return <Mounter mount={mount} />;
};
