import { useQuery } from '@tanstack/react-query';
import { getActivityList } from '@/api/activity';
import { useEnvironment } from '@/context/environment/hooks';
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

  const { data: triggeredFromApi = false } = useQuery({
    queryKey: [QueryKeys.hasApiTrigger, currentEnvironment?._id, workflowId],
    queryFn: async ({ signal }) => {
      if (!currentEnvironment?._id || !workflowId || !lastTriggeredAt) {
        return false;
      }

      const cached = getCachedApiTrigger(currentEnvironment._id, workflowId);
      if (cached) return true;

      try {
        const { data: activities } = await getActivityList({
          environment: currentEnvironment,
          page: 0,
          limit: 10,
          filters: { workflows: [workflowId] },
          signal,
        });

        if (!activities?.length) return false;

        const cutoffTimestamp = new Date(lastTriggeredAt);
        const recentActivities = activities.filter((activity) => new Date(activity.createdAt) > cutoffTimestamp);
        if (!recentActivities.length) return false;

        const isApiTriggered = hasApiTrigger(recentActivities);
        if (isApiTriggered) {
          cacheApiTrigger(currentEnvironment._id, workflowId);
        }

        return isApiTriggered;
      } catch {
        return false;
      }
    },
    enabled: !!currentEnvironment?._id && !!workflowId && !!lastTriggeredAt,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: false,
  });

  return triggeredFromApi;
}
