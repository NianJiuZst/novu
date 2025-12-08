import type { DiscoverWorkflowOutput, HealthCheck } from '@novu/framework/internal';
import { UseQueryOptions, UseQueryResult, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { buildBridgeHTTPClient } from '@/api/bridge-client';
import { useStudioState } from '@/context/studio/hooks';

export function useBridgeAPI() {
  const state = useStudioState();
  const bridgeURL = state.isLocalStudio ? state.localBridgeURL : '';

  return useMemo(() => buildBridgeHTTPClient(bridgeURL), [bridgeURL]);
}

const BRIDGE_STATUS_REFRESH_INTERVAL_IN_MS = 5 * 1000;

export function useDiscover(options?: Partial<UseQueryOptions<{ workflows: DiscoverWorkflowOutput[] }>>) {
  const api = useBridgeAPI();
  const state = useStudioState();
  const bridgeURL = state.isLocalStudio ? state.localBridgeURL : '';

  return useQuery({
    queryKey: ['bridge-workflows', bridgeURL],
    queryFn: async () => {
      return api.discover();
    },
    enabled: !!bridgeURL,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useWorkflow(
  workflowId: string,
  options?: Partial<UseQueryOptions<DiscoverWorkflowOutput>>
): UseQueryResult<DiscoverWorkflowOutput, unknown> {
  const api = useBridgeAPI();

  return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      return api.getWorkflow(workflowId);
    },
    enabled: !!workflowId,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useBridgeConnectionStatus(options?: Partial<UseQueryOptions<HealthCheck>>) {
  const api = useBridgeAPI();
  const state = useStudioState();
  const bridgeURL = state.isLocalStudio ? state.localBridgeURL : '';

  const res = useQuery<HealthCheck>({
    queryKey: ['bridge-health-check', bridgeURL],
    queryFn: async () => {
      return await api.healthCheck();
    },
    enabled: !!bridgeURL,
    networkMode: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: BRIDGE_STATUS_REFRESH_INTERVAL_IN_MS,
    ...options,
  });

  return {
    ...res,
    status: res.data?.status === 'ok' ? 'connected' : 'disconnected',
    bridgeURL,
  };
}
