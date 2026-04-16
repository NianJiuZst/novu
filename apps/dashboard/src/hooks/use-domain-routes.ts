import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateRouteBody, createRoute, deleteRoute, UpdateRouteBody, updateRoute } from '@/api/domains';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';

export function useCreateRoute(domainId: string | undefined) {
  const queryClient = useQueryClient();
  const { currentEnvironment } = useEnvironment();

  return useMutation({
    mutationFn: (body: CreateRouteBody) => createRoute(domainId!, body, currentEnvironment!),
    onSuccess: (data) => {
      queryClient.setQueryData([QueryKeys.fetchDomain, domainId], data);
    },
  });
}

export function useUpdateRoute(domainId: string | undefined) {
  const queryClient = useQueryClient();
  const { currentEnvironment } = useEnvironment();

  return useMutation({
    mutationFn: ({ routeIndex, body }: { routeIndex: number; body: UpdateRouteBody }) =>
      updateRoute(domainId!, routeIndex, body, currentEnvironment!),
    onSuccess: (data) => {
      queryClient.setQueryData([QueryKeys.fetchDomain, domainId], data);
    },
  });
}

export function useDeleteRoute(domainId: string | undefined) {
  const queryClient = useQueryClient();
  const { currentEnvironment } = useEnvironment();

  return useMutation({
    mutationFn: (routeIndex: number) => deleteRoute(domainId!, routeIndex, currentEnvironment!),
    onSuccess: (data) => {
      queryClient.setQueryData([QueryKeys.fetchDomain, domainId], data);
    },
  });
}
