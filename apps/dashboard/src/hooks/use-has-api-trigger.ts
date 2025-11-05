import { useQuery } from '@tanstack/react-query';
import { getActivityList } from '@/api/activity';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';

type UseHasApiTriggerOptions = {
  workflowId?: string;
};

export function useHasApiTrigger({ workflowId }: UseHasApiTriggerOptions) {
  const { currentEnvironment } = useEnvironment();

  const { data: triggeredFromApi = false } = useQuery({
    queryKey: [QueryKeys.hasApiTrigger, currentEnvironment?._id, workflowId],
    queryFn: async ({ signal }) => {
      if (!currentEnvironment || !workflowId) {
        return false;
      }

      try {
        const { data: activities } = await getActivityList({
          environment: currentEnvironment,
          page: 0,
          limit: 1,
          filters: { workflows: [workflowId] },
          signal,
        });

        if (!activities?.length) {
          return false;
        }

        const mostRecentActivity = activities[0];
        const source = mostRecentActivity.payload?.__source;

        return !source || source !== 'dashboard';
      } catch {
        return false;
      }
    },
    enabled: !!currentEnvironment?._id && !!workflowId,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: false,
  });

  return triggeredFromApi;
}
