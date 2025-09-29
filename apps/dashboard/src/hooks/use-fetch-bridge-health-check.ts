import type { HealthCheck } from '@novu/framework/internal';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { getBridgeHealthCheck } from '@/api/bridge';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';
import { ConnectionStatus } from '@/utils/types';

const BRIDGE_STATUS_REFRESH_INTERVAL_IN_MS = 10 * 1000;

export const useFetchBridgeHealthCheck = () => {
  const { currentEnvironment } = useEnvironment();
  const bridgeURL = currentEnvironment?.bridge?.url || '';
  const failureCountRef = useRef(0);

  const getRefetchInterval = useCallback(() => {
    // After 3 failures, reduce retry time to 10 seconds (already at 10s, but maintain consistency)
    return failureCountRef.current >= 3 ? 10000 : BRIDGE_STATUS_REFRESH_INTERVAL_IN_MS;
  }, []);

  const { data, isLoading, error } = useQuery<HealthCheck>({
    queryKey: [QueryKeys.bridgeHealthCheck, currentEnvironment?._id, bridgeURL],
    queryFn: () => getBridgeHealthCheck({ environment: currentEnvironment! }),
    enabled: !!bridgeURL,
    networkMode: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: getRefetchInterval(),
    onSuccess: () => {
      // Reset failure count on successful response
      failureCountRef.current = 0;
    },
    onError: () => {
      // Increment failure count on error
      failureCountRef.current += 1;
    },
    meta: {
      showError: false,
    },
  });

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
