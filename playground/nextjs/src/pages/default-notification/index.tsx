import { Inbox, DefaultNotification, Notification } from '@novu/nextjs';
import { useCallback, useEffect, useState } from 'react';
import Title from '@/components/Title';
import { novuConfig } from '@/utils/config';

export default function Home() {
  const [forceRender, setForceRender] = useState(0);

  /*
   *  useEffect(() => {
   *  setInterval(() => {
   *   setForceRender((prev) => prev + 1);
   *  }, 1000);
   *  }, [setForceRender]);
   */

  const renderNotification = useCallback(
    (notification: Notification) => {
      console.log('NextJS.Inbox.renderNotification', { notification });

      /*
       * return (
       * <div>
       *  Body: {notification.body} {new Date().toISOString()}
       *  <br />
       *  {notification.isRead ? 'Read' : 'Unread'}
       *  <br />
       *  <button
       *    style={{
       *      backgroundColor: 'blue',
       *    }}
       *    onClick={(e) => {
       *      e.preventDefault();
       *      e.stopPropagation();
       *      if (notification.isRead) {
       *        notification.unread();
       *      } else {
       *        notification.read();
       *      }
       *    }}
       *  >
       *    Read
       *  </button>
       * </div>
       * );
       */

      return (
        <DefaultNotification
          notification={notification}
          renderBody={(body) => {
            console.log('NextJS.Inbox.renderBody', { body });

            return (
              <div>
                Body: {body} {new Date().toISOString()}
              </div>
            );
          }}
        />
      );
    },
    [forceRender]
  );

  return (
    <>
      {forceRender}
      <Title title="Default Notification" />
      <Inbox {...novuConfig} renderNotification={renderNotification} />
    </>
  );
}
