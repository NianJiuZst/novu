import { createSignal, onCleanup, onMount } from 'solid-js';

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
  const createChannel = () => {
    try {
      return canUseBroadcastChannel() ? new BroadcastChannel(channelName) : undefined;
    } catch (error) {
      return undefined;
    }
  };

  const [tabsChannel] = createSignal(createChannel());

  const postMessage = (args: T) => {
    try {
      const channel = tabsChannel();
      channel?.postMessage(args);
    } catch (error) {
      console.warn('Failed to post message to BroadcastChannel:', error);
    }
  };

  onMount(() => {
    const channel = tabsChannel();
    if (!channel) {
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
      channel.addEventListener('message', listener);
    } catch (error) {
      console.warn('Failed to add BroadcastChannel listener:', error);
    }

    onCleanup(() => {
      try {
        channel?.removeEventListener('message', listener);
      } catch (error) {
        console.warn('Failed to remove BroadcastChannel listener:', error);
      }
    });
  });

  return { postMessage };
};
