import type { ChannelConnectionResponse, NovuError } from '@novu/js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNovu } from './NovuProvider';

export type UseChannelConnectionProps = {
  identifier: string;
  onSuccess?: (data: ChannelConnectionResponse | null) => void;
  onError?: (error: NovuError) => void;
};

export type UseChannelConnectionResult = {
  connection?: ChannelConnectionResponse | null;
  error?: NovuError;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
};

/**
 * Get a channel connection by identifier.
 */
export const useChannelConnection = (props: UseChannelConnectionProps): UseChannelConnectionResult => {
  const novu = useNovu();
  const propsRef = useRef<UseChannelConnectionProps>(props);
  propsRef.current = props;

  const [connection, setConnection] = useState<ChannelConnectionResponse | null>();
  const [error, setError] = useState<NovuError>();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const fetchConnection = useCallback(
    async (options?: { refetch: boolean }) => {
      const { identifier, onSuccess, onError } = propsRef.current;
      if (options?.refetch) {
        setError(undefined);
        setIsLoading(true);
      }

      setIsFetching(true);

      const response = await novu.channelConnections.get({ identifier });

      if (response.error) {
        setError(response.error as NovuError);
        onError?.(response.error as NovuError);
      } else if (response.data !== undefined) {
        onSuccess?.(response.data);
        setConnection(response.data);
      }
      setIsLoading(false);
      setIsFetching(false);
    },
    [novu]
  );

  useEffect(() => {
    const cleanupGetPending = novu.on('channel-connection.get.pending', () => {
      setIsFetching(true);
    });

    const cleanupGetResolved = novu.on('channel-connection.get.resolved', ({ data, error: resolvedError }) => {
      const { onSuccess, onError } = propsRef.current;
      if (resolvedError) {
        setError(resolvedError as NovuError);
        onError?.(resolvedError as NovuError);
      } else {
        setConnection((data as ChannelConnectionResponse) ?? null);
        onSuccess?.((data as ChannelConnectionResponse) ?? null);
      }
      setIsFetching(false);
    });

    const cleanupDeleteResolved = novu.on('channel-connection.delete.resolved', ({ args }) => {
      if (!args || args.identifier !== propsRef.current.identifier) {
        return;
      }
      setConnection(null);
      propsRef.current.onSuccess?.(null);
      setIsFetching(false);
    });

    void fetchConnection({ refetch: true });

    return () => {
      cleanupGetPending();
      cleanupGetResolved();
      cleanupDeleteResolved();
    };
  }, [novu, fetchConnection]);

  const refetch = useCallback(() => fetchConnection({ refetch: true }), [fetchConnection]);

  return {
    connection,
    error,
    isLoading,
    isFetching,
    refetch,
  };
};
