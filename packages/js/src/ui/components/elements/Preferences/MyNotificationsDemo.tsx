import { useStyle } from '../../../helpers';
import { MyNotifications } from './MyNotifications';

export const MyNotificationsDemo = () => {
  const style = useStyle();

  return (
    <div class={style('myNotificationsDemo', 'nt-p-4 nt-max-w-2xl nt-mx-auto nt-space-y-4')}>
      <div class={style('myNotificationsDemoHeader', 'nt-mb-6')}>
        <h2 class={style('myNotificationsDemoTitle', 'nt-text-xl nt-font-bold nt-text-foreground nt-mb-2')}>
          My Notifications Demo
        </h2>
        <p class={style('myNotificationsDemoDescription', 'nt-text-sm nt-text-foreground-alpha-600')}>
          This demo showcases the new "My notifications" feature that allows users to create custom notification
          queries.
        </p>
      </div>

      <MyNotifications />

      <div class={style('myNotificationsDemoInfo', 'nt-mt-6 nt-p-4 nt-bg-neutral-alpha-50 nt-rounded-lg nt-text-sm')}>
        <h3 class={style('myNotificationsDemoInfoTitle', 'nt-font-semibold nt-mb-2')}>How it works:</h3>
        <ul class={style('myNotificationsDemoInfoList', 'nt-space-y-1 nt-text-foreground-alpha-600')}>
          <li>• Users can create custom notification queries describing what they want to be notified about</li>
          <li>• Each query creates a new preference entry for the "my-notifications" workflow</li>
          <li>• AI will match system triggers against user-generated prompts</li>
          <li>• Users can manage multiple custom notifications and remove them as needed</li>
          <li>• The UI provides real-time validation and character counting</li>
        </ul>
      </div>
    </div>
  );
};
