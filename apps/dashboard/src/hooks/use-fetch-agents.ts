import { useQuery } from '@tanstack/react-query';
import { getAgents } from '@/api/agents';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';

export function useFetchAgents() {
  const { currentEnvironment } = useEnvironment();

  return useQuery({
    queryKey: [QueryKeys.fetchAgents, currentEnvironment?._id],
    queryFn: () => getAgents({ environment: currentEnvironment! }),
    enabled: !!currentEnvironment?._id,
    refetchOnWindowFocus: true,
  });
}
