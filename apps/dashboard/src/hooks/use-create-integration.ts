import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEnvironment } from '../context/environment/hooks';
import { createIntegration } from '../api/integrations';
import type { CreateIntegrationData } from '../api/integrations';
import { QueryKeys } from '../utils/query-keys';
import type { IIntegration } from '@novu/shared';

export function useCreateIntegration() {
  const { currentEnvironment } = useEnvironment();
  const queryClient = useQueryClient();

  return useMutation<{ data: IIntegration }, unknown, CreateIntegrationData>({
    mutationFn: (data: CreateIntegrationData) => createIntegration(data, currentEnvironment!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchIntegrations, currentEnvironment?._id] });
    },
  });
}
