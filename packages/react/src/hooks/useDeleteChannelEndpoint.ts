import type { NovuError } from '@novu/js';
import { useCallback, useRef, useState } from 'react';
import { useNovu } from './NovuProvider';

export type UseDeleteChannelEndpointProps = {
  onSuccess?: () => void;
  onError?: (error: NovuError) => void;
};

export type UseDeleteChannelEndpointResult = {
  isDeleting: boolean;
  error?: NovuError;
  remove: (identifier: string) => Promise<{
    data?: undefined;
    error?: NovuError | undefined;
  }>;
};

export const useDeleteChannelEndpoint = (props: UseDeleteChannelEndpointProps = {}): UseDeleteChannelEndpointResult => {
  const propsRef = useRef<UseDeleteChannelEndpointProps>(props);
  propsRef.current = props;
  const novu = useNovu();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<NovuError>();

  const remove = useCallback(
    async (identifier: string) => {
      const { onSuccess, onError } = propsRef.current;
      setError(undefined);
      setIsDeleting(true);

      const response = await novu.channelEndpoints.delete({ identifier });

      setIsDeleting(false);

      if (response.error) {
        setError(response.error as NovuError);
        onError?.(response.error as NovuError);
      } else {
        onSuccess?.();
      }

      return response as { data?: undefined; error?: NovuError };
    },
    [novu]
  );

  return {
    remove,
    isDeleting,
    error,
  };
};
