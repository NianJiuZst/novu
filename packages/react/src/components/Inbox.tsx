import React, { useMemo } from 'react';
import { DefaultProps, DefaultInboxProps, WithChildrenProps } from '../utils/types';
import { Mounter } from './Mounter';
import { useNovuUI } from '../context/NovuUIContext';
import { useRenderer } from '../context/RendererContext';
import { InternalNovuProvider, useNovu, useUnsafeNovu } from '../hooks/NovuProvider';
import { NovuUI } from './NovuUI';
import { withRenderer } from './Renderer';
import { useDataRef } from '../hooks/internal/useDataRef';

export type InboxProps = DefaultProps | WithChildrenProps;

const _DefaultInbox = (props: DefaultInboxProps) => {
  const {
    open,
    renderNotification,
    renderBell,
    onNotificationClick,
    onPrimaryActionClick,
    onSecondaryActionClick,
    placement,
    placementOffset,
  } = props;
  const { novuUI } = useNovuUI();
  const { mountElement } = useRenderer();
  const dataRef = useDataRef({
    open,
    renderNotification,
    renderBell,
    onNotificationClick,
    onPrimaryActionClick,
    onSecondaryActionClick,
  });

  const mount = React.useCallback(
    (element: HTMLElement) => {
      console.log('React.Inbox.mount', { novuUI });

      return novuUI.mountComponent({
        name: 'Inbox',
        props: {
          open: dataRef.current.open,
          renderNotification: dataRef.current.renderNotification
            ? (el, notification) => mountElement(el, dataRef.current.renderNotification!(notification))
            : undefined,
          renderBell: dataRef.current.renderBell
            ? (el, unreadCount) => mountElement(el, dataRef.current.renderBell!(unreadCount))
            : undefined,
          onNotificationClick: dataRef.current.onNotificationClick,
          onPrimaryActionClick: dataRef.current.onPrimaryActionClick,
          onSecondaryActionClick: dataRef.current.onSecondaryActionClick,
          placementOffset,
          placement,
        },
        element,
      });
    },
    [dataRef]
  );

  return <Mounter mount={mount} />;
};

const DefaultInbox = withRenderer(_DefaultInbox);

export const Inbox = React.memo((props: InboxProps) => {
  const { applicationIdentifier, subscriberId, subscriberHash, backendUrl, socketUrl } = props;
  const novu = useUnsafeNovu();

  console.log('React.Inbox.render', { novu });

  if (novu) {
    return <InboxChild {...props} />;
  }

  return (
    <InternalNovuProvider
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
      subscriberHash={subscriberHash}
      backendUrl={backendUrl}
      socketUrl={socketUrl}
      userAgentType="components"
    >
      <InboxChild {...props} />
    </InternalNovuProvider>
  );
});

const InboxChild = React.memo((props: InboxProps) => {
  const {
    localization,
    appearance,
    tabs,
    preferencesFilter,
    routerPush,
    applicationIdentifier,
    subscriberId,
    subscriberHash,
    backendUrl,
    socketUrl,
  } = props;
  const novu = useNovu();

  const options = useMemo(() => {
    return {
      localization,
      appearance,
      tabs,
      preferencesFilter,
      routerPush,
      options: { applicationIdentifier, subscriberId, subscriberHash, backendUrl, socketUrl },
    };
  }, [
    localization,
    appearance,
    tabs,
    preferencesFilter,
    applicationIdentifier,
    subscriberId,
    subscriberHash,
    backendUrl,
    socketUrl,
  ]);

  if (isWithChildrenProps(props)) {
    return (
      <NovuUI options={options} novu={novu}>
        {props.children}
      </NovuUI>
    );
  }

  const {
    open,
    renderNotification,
    renderBell,
    onNotificationClick,
    onPrimaryActionClick,
    onSecondaryActionClick,
    placementOffset,
    placement,
  } = props;

  return (
    <NovuUI options={options} novu={novu}>
      <DefaultInbox
        open={open}
        renderNotification={renderNotification}
        renderBell={renderBell}
        onNotificationClick={onNotificationClick}
        onPrimaryActionClick={onPrimaryActionClick}
        onSecondaryActionClick={onSecondaryActionClick}
        placement={placement}
        placementOffset={placementOffset}
      />
    </NovuUI>
  );
});

function isWithChildrenProps(props: InboxProps): props is WithChildrenProps {
  return 'children' in props;
}
