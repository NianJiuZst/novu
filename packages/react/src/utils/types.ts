import type {
  Appearance,
  InboxProps,
  Localization,
  Notification,
  NotificationActionClickHandler,
  NotificationClickHandler,
  PreferencesFilter,
  RouterPush,
  Tab,
} from '@novu/js/ui';

export type NotificationsRenderer = (notification: Notification) => React.ReactNode;

export type BellRenderer = (unreadCount: number) => React.ReactNode;

export type DefaultInboxProps = {
  /** Controls the visibility state of the inbox */
  open?: boolean;
  renderNotification?: NotificationsRenderer;
  renderBell?: BellRenderer;
  onNotificationClick?: NotificationClickHandler;
  onPrimaryActionClick?: NotificationActionClickHandler;
  onSecondaryActionClick?: NotificationActionClickHandler;
  /** Position of the inbox popover relative to the bell, supports all placements from floating-ui */
  placement?: InboxProps['placement'];
  /** Offset distance of the inbox popover from its anchor point, supports all offset options from floating-ui */
  placementOffset?: InboxProps['placementOffset'];
};

export type BaseProps = {
  /** Unique identifier for the application, can be found on the API keys page */
  applicationIdentifier: string;
  /** Unique identifier for the subscriber, usually your database id of the user */
  subscriberId: string;
  /** Hash used to verify the subscriber's identity, used to verify the identity of the subscriber interacting with the Inbox */
  subscriberHash?: string;
  /** Custom URL for the Novu API, for EU point to: https://eu.api.novu.co or self-hosted instance of Novu */
  backendUrl?: string;
  /** Custom Websocket URL for Novu, for EU point to: https://eu.ws.novu.co or self-hosted instance of Novu */
  socketUrl?: string;
  /** Used to customize the look and feel of the Inbox, css or tailwind classes could be used  */
  appearance?: Appearance;
  /** You can customize the text of the Inbox by providing a localization object */
  localization?: Localization;
  /** Creates a tabbed layout for the inbox, each tab can be filtered to include specific notification feeds */
  tabs?: Array<Tab>;
  /** Used to hide specific workflows from the Inbox preference component */
  preferencesFilter?: PreferencesFilter;
  /** Custom router push function for handling the navigation when clicked on a notification or action button */
  routerPush?: RouterPush;
};

export type DefaultProps = BaseProps &
  DefaultInboxProps & {
    children?: never;
  };

export type WithChildrenProps = BaseProps & {
  children: React.ReactNode;
};

export type { Notification };
