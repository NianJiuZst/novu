import { createEffect, createResource, createSignal, onCleanup, onMount } from 'solid-js';
import type { ConnectAndLinkArgs } from '../../../channel-connections/channel-connections';
import type { ChannelConnectionResponse, GenerateChatOAuthUrlArgs } from '../../../channel-connections/types';
import { useNovu } from '../../context';

export type UseChannelConnectionOptions = {
  integrationIdentifier: string;
  connectionIdentifier?: string;
  subscriberId?: string;
};

export const useChannelConnection = (options: UseChannelConnectionOptions) => {
  const novuAccessor = useNovu();
  const [loading, setLoading] = createSignal(true);

  const [connection, { mutate, refetch }] = createResource(options, async ({ connectionIdentifier }) => {
    try {
      if (!connectionIdentifier) {
        return null;
      }

      const response = await novuAccessor().channelConnections.get({
        identifier: connectionIdentifier,
      });

      return response.data ?? null;
    } catch {
      return null;
    }
  });

  const connect = async (args: GenerateChatOAuthUrlArgs) => {
    setLoading(true);
    const response = await novuAccessor().channelConnections.generateOAuthUrl(args);
    setLoading(false);

    return response;
  };

  const connectAndLink = async (args: ConnectAndLinkArgs) => {
    setLoading(true);
    const response = await novuAccessor().channelConnections.connectAndLink(args);
    setLoading(false);

    return response;
  };

  const disconnect = async (identifier: string) => {
    setLoading(true);
    const response = await novuAccessor().channelConnections.delete({ identifier });
    if (!response.error) {
      mutate(null);
    }
    setLoading(false);

    return response;
  };

  onMount(() => {
    const currentNovu = novuAccessor();

    const cleanupGetPending = currentNovu.on('channel-connection.get.pending', () => {
      setLoading(true);
    });

    const cleanupGetResolved = currentNovu.on('channel-connection.get.resolved', ({ data }) => {
      mutate((data as ChannelConnectionResponse) ?? null);
      setLoading(false);
    });

    const cleanupDeletePending = currentNovu.on('channel-connection.delete.pending', ({ args }) => {
      if (!args || args.identifier !== options.connectionIdentifier) {
        return;
      }
      setLoading(true);
    });

    const cleanupDeleteResolved = currentNovu.on('channel-connection.delete.resolved', ({ args }) => {
      if (!args || args.identifier !== options.connectionIdentifier) {
        return;
      }
      mutate(null);
      setLoading(false);
    });

    onCleanup(() => {
      cleanupGetPending();
      cleanupGetResolved();
      cleanupDeletePending();
      cleanupDeleteResolved();
    });
  });

  createEffect(() => {
    setLoading(connection.loading);
  });

  return { connection, loading, mutate, refetch, connect, connectAndLink, disconnect };
};
