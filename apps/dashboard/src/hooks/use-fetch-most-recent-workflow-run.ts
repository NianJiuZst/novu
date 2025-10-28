import { FeatureFlagsKeysEnum, type IActivity } from '@novu/shared';
import { useQuery } from '@tanstack/react-query';
import { getNotification, getWorkflowRun, getWorkflowRunsList } from '@/api/activity';
import { useEnvironment } from '@/context/environment/hooks';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { QueryKeys } from '@/utils/query-keys';

type UseFetchMostRecentWorkflowRunOptions = {
  workflowId?: string;
  enabled?: boolean;
};

export function useFetchMostRecentWorkflowRun({ workflowId, enabled = true }: UseFetchMostRecentWorkflowRunOptions) {
  const { currentEnvironment } = useEnvironment();
  const isWorkflowRunMigrationEnabled = useFeatureFlag(FeatureFlagsKeysEnum.IS_WORKFLOW_RUN_PAGE_MIGRATION_ENABLED);

  const { data, isPending, error } = useQuery<IActivity | null>({
    queryKey: [QueryKeys.fetchMostRecentWorkflowRun, currentEnvironment?._id, workflowId],
    queryFn: async ({ signal }) => {
      if (!currentEnvironment || !workflowId) {
        return null;
      }

      const response = await getWorkflowRunsList({
        environment: currentEnvironment,
        limit: 1,
        filters: {
          workflows: [workflowId],
        },
        signal,
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const mostRecentRun = response.data[0];

      if (isWorkflowRunMigrationEnabled) {
        return getWorkflowRun(mostRecentRun._id, currentEnvironment);
      }

      return getNotification(mostRecentRun._id, currentEnvironment);
    },
    enabled: enabled && !!currentEnvironment?._id && !!workflowId,
    staleTime: 30000,
  });

  return {
    mostRecentRun: data,
    isPending,
    error,
  };
}
