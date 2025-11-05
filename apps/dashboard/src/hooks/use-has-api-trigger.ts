import { FeatureFlagsKeysEnum } from '@novu/shared';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowRunsList } from '@/api/activity';
import { useEnvironment } from '@/context/environment/hooks';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { QueryKeys } from '@/utils/query-keys';

const STORAGE_KEY = 'novu_api_trigger_';

function getCacheKey(environmentId: string, workflowId: string): string {
  return `${STORAGE_KEY}${environmentId}_${workflowId}`;
}

function getCachedApiTrigger(environmentId: string, workflowId: string): boolean | null {
  try {
    const cached = localStorage.getItem(getCacheKey(environmentId, workflowId));
    return cached === 'true' ? true : null;
  } catch {
    return null;
  }
}

function cacheApiTrigger(environmentId: string, workflowId: string): void {
  try {
    localStorage.setItem(getCacheKey(environmentId, workflowId), 'true');
  } catch {
    // Silently fail
  }
}

function hasApiTrigger(runs: Array<{ payload?: Record<string, unknown> }>): boolean {
  return runs.some((run) => {
    const source = run.payload?.__source;
    return !source || source !== 'dashboard';
  });
}

type UseHasApiTriggerOptions = {
  workflowId?: string;
  lastTriggeredAt?: string;
};

export function useHasApiTrigger({ workflowId, lastTriggeredAt }: UseHasApiTriggerOptions) {
  const { currentEnvironment } = useEnvironment();
  const isWorkflowRunsEnabled = useFeatureFlag(FeatureFlagsKeysEnum.IS_WORKFLOW_RUN_PAGE_MIGRATION_ENABLED);

  const { data: triggeredFromApi = false } = useQuery({
    queryKey: [QueryKeys.hasApiTrigger, currentEnvironment?._id, workflowId],
    queryFn: async ({ signal }) => {
      if (!currentEnvironment?._id || !workflowId || !lastTriggeredAt) {
        return false;
      }

      const cached = getCachedApiTrigger(currentEnvironment._id, workflowId);
      if (cached) return true;

      try {
        const { data: runs } = await getWorkflowRunsList({
          environment: currentEnvironment,
          limit: 50,
          filters: { workflows: [workflowId] },
          signal,
        });

        if (!runs?.length) return false;

        const isApiTriggered = hasApiTrigger(runs);
        if (isApiTriggered) {
          cacheApiTrigger(currentEnvironment._id, workflowId);
        }

        return isApiTriggered;
      } catch {
        return false;
      }
    },
    enabled: isWorkflowRunsEnabled && !!currentEnvironment?._id && !!workflowId && !!lastTriggeredAt,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: false,
  });

  return triggeredFromApi;
}
