import type { ExecuteOutput } from '@novu/framework/internal';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useBridgeAPI } from './use-bridge-api';

type UseStudioStepPreviewParams = {
  workflowId: string;
  stepId: string;
  controls?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  enabled?: boolean;
};

export function useStudioStepPreview({
  workflowId,
  stepId,
  controls = {},
  payload = {},
  enabled = true,
}: UseStudioStepPreviewParams): UseQueryResult<ExecuteOutput, unknown> {
  const api = useBridgeAPI();

  return useQuery({
    queryKey: ['studio-step-preview', workflowId, stepId, controls, payload],
    queryFn: async () => {
      return api.getStepPreview({
        workflowId,
        stepId,
        controls,
        payload,
      });
    },
    enabled: enabled && !!workflowId && !!stepId,
    refetchOnWindowFocus: false,
  });
}
