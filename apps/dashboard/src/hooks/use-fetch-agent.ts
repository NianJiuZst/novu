import { useQuery } from '@tanstack/react-query';
import { getAgent } from '@/api/agents';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';

export function useFetchAgent(agentId: string | undefined) {
  const { currentEnvironment } = useEnvironment();

  return useQuery({
    queryKey: [QueryKeys.fetchAgent, currentEnvironment?._id, agentId],
    queryFn: () => getAgent({ agentId: agentId!, environment: currentEnvironment! }),
    enabled: !!currentEnvironment?._id && !!agentId,
    refetchOnWindowFocus: true,
  });
}
