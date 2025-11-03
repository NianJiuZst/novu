import { useEffect, useState } from 'react';

function isReactNative() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.product === 'string' &&
    navigator.product.toLowerCase() === 'reactnative'
  );
}

function canUseBroadcastChannel() {
  return !isReactNative() && typeof BroadcastChannel !== 'undefined';
}

export const useBrowserTabsChannel = <T = unknown>({
  channelName,
  onMessage,
}: {
  channelName: string;
  onMessage: (args: T) => void;
}) => {
  const [tabsChannel] = useState(() => {
    try {
      return canUseBroadcastChannel() ? new BroadcastChannel(channelName) : undefined;
    } catch (error) {
      return undefined;
    }
  });

  const postMessage = (data: T) => {
    try {
      tabsChannel?.postMessage(data);
    } catch (error) {
      console.warn('Failed to post message to BroadcastChannel:', error);
    }
  };

  useEffect(() => {
    if (!tabsChannel) {
      return;
    }

    const listener = (event: MessageEvent<T>) => {
      try {
        onMessage(event.data);
      } catch (error) {
        console.warn('Failed to handle BroadcastChannel message:', error);
      }
    };

    try {
      tabsChannel.addEventListener('message', listener);
    } catch (error) {
      console.warn('Failed to add BroadcastChannel listener:', error);
    }

    return () => {
      try {
        tabsChannel?.removeEventListener('message', listener);
      } catch (error) {
        console.warn('Failed to remove BroadcastChannel listener:', error);
      }
    };
  }, []);

  return { postMessage };
};
