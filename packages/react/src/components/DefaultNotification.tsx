import React, { useEffect } from 'react';
import { Action, Notification } from '@novu/js';
import { NotificationActionClickHandler, NotificationClickHandler } from '@novu/js/ui';
import { useNovuUI } from '../context/NovuUIContext';
import { useRenderer } from '../context/RendererContext';
import { Mounter } from './Mounter';
import { useDataRef } from '../hooks/internal/useDataRef';

export type DefaultNotificationProps = {
  notification: Notification;
  className?: string;
  onNotificationClick?: NotificationClickHandler;
  onPrimaryActionClick?: NotificationActionClickHandler;
  onSecondaryActionClick?: NotificationActionClickHandler;
  renderAvatar?: (avatar?: string) => React.ReactNode;
  renderSubject?: (subject?: string) => React.ReactNode;
  renderBody?: (body: string) => React.ReactNode;
  renderActions?: (notification: Notification) => React.ReactNode;
  renderCustomActions?: (primaryAction?: Action, secondaryAction?: Action) => React.ReactNode;
  renderDate?: (date: string) => React.ReactNode;
  renderDot?: (isRead: boolean) => React.ReactNode;
};

export const DefaultNotification = (props: DefaultNotificationProps) => {
  const { novuUI } = useNovuUI();
  const { mountElement } = useRenderer();
  const dataRef = useDataRef({
    ...props,
  });

  useEffect(() => {
    console.log('React.DefaultNotification.mount.useEffect', { notification: props.notification });
  }, []);

  const mount = React.useCallback(
    (element: HTMLElement) => {
      const {
        notification,
        className,
        onNotificationClick,
        onPrimaryActionClick,
        onSecondaryActionClick,
        renderAvatar,
        renderSubject,
        renderBody,
        renderActions,
        renderCustomActions,
        renderDate,
        renderDot,
      } = dataRef.current;
      console.log('React.DefaultNotification.mount', { notification, element, isConnected: element.isConnected });

      return novuUI.mountComponent({
        name: 'DefaultNotification',
        props: {
          notification,
          className,
          onNotificationClick,
          onPrimaryActionClick,
          onSecondaryActionClick,
          renderAvatar: renderAvatar ? (el, avatar) => mountElement(el, renderAvatar(avatar)) : undefined,
          renderSubject: renderSubject ? (el, subject) => mountElement(el, renderSubject(subject)) : undefined,
          renderBody: renderBody ? (el, body) => mountElement(el, renderBody(body)) : undefined,
          renderActions: renderActions
            ? (el, notification) => mountElement(el, renderActions(notification))
            : undefined,
          renderCustomActions: renderCustomActions
            ? (el, primaryAction, secondaryAction) =>
                mountElement(el, renderCustomActions(primaryAction, secondaryAction))
            : undefined,
          renderDate: renderDate ? (el, date) => mountElement(el, renderDate(date)) : undefined,
          renderDot: renderDot ? (el, isRead) => mountElement(el, renderDot(isRead)) : undefined,
        },
        element,
      });
    },
    [dataRef]
  );

  console.log('React.DefaultNotification.render');

  /*
   * novuUI?.scheduleUpdate();
   * document.dispatchEvent(new Event(props.notification.id));
   */

  return <Mounter mount={mount} />;
};

DefaultNotification.displayName = 'DefaultNotification';
DefaultNotification.asdf = 'DefaultNotification';
