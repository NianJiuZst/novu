import type { HealthCheck } from '@novu/framework/internal';
import type { IEnvironment } from '@novu/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getBridgeHealthCheck } from '@/api/bridge';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';
import { ConnectionStatus } from '@/utils/types';

const BRIDGE_STATUS_REFRESH_INTERVAL_IN_MS = 10 * 1000;

export const useFetchBridgeHealthCheck = () => {
  const { currentEnvironment } = useEnvironment();
  const bridgeURL = currentEnvironment?.bridge?.url || '';
  const failureCountRef = useRef(0);
  const [refetchInterval, setRefetchInterval] = useState(BRIDGE_STATUS_REFRESH_INTERVAL_IN_MS);

  const { data, isLoading, error } = useQuery<HealthCheck>({
    queryKey: [QueryKeys.bridgeHealthCheck, currentEnvironment?._id, bridgeURL],
    queryFn: () => getBridgeHealthCheck({ environment: currentEnvironment as IEnvironment }),
    enabled: !!bridgeURL,
    networkMode: 'always',
    refetchOnWindowFocus: true,
    refetchInterval,
    meta: {
      showError: false,
    },
  });

  // Update interval based on success/failure state
  useEffect(() => {
    const isSuccess = data?.status === 'ok' && !error;

    if (isSuccess) {
      failureCountRef.current = 0;
      setRefetchInterval(BRIDGE_STATUS_REFRESH_INTERVAL_IN_MS); // Keep at 10 seconds on success
    } else if (data !== undefined || error) {
      // Only count as failure if we actually got a response
      failureCountRef.current += 1;
      // After 3 failures, keep at 10 second interval (no change needed as it's already 10s)
      setRefetchInterval(BRIDGE_STATUS_REFRESH_INTERVAL_IN_MS);
    }
  }, [data, error]);

  const status = useMemo<ConnectionStatus>(() => {
    if (isLoading) {
      return ConnectionStatus.LOADING;
    }

    if (bridgeURL && !error && data?.status === 'ok') {
      return ConnectionStatus.CONNECTED;
    }

    return ConnectionStatus.DISCONNECTED;
  }, [bridgeURL, isLoading, data, error]);

  return {
    status,
    bridgeURL,
  };
};
