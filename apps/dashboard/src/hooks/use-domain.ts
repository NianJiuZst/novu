import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DomainResponse, fetchDomain, verifyDomain } from '@/api/domains';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';

export function useFetchDomain(domainId: string | undefined) {
  const { currentEnvironment } = useEnvironment();

  return useQuery<DomainResponse>({
    queryKey: [QueryKeys.fetchDomain, domainId],
    queryFn: () => fetchDomain(domainId!, currentEnvironment!),
    enabled: !!domainId && !!currentEnvironment,
  });
}

export function useVerifyDomain(domainId: string | undefined) {
  const queryClient = useQueryClient();
  const { currentEnvironment } = useEnvironment();

  return useMutation({
    mutationFn: () => verifyDomain(domainId!, currentEnvironment!),
    onSuccess: (data) => {
      queryClient.setQueryData([QueryKeys.fetchDomain, domainId], data);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchDomains] });
    },
  });
}
