import { updateExternalAuthIssuerUrls } from '@/api/environments';
import { useEnvironment } from '@/context/environment/hooks';
import { OmitEnvironmentFromParameters } from '@/utils/types';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

type ExternalAuthIssuerUpdateParams = OmitEnvironmentFromParameters<typeof updateExternalAuthIssuerUrls>;

export function useAddExternalAuthIssuerUrls(
  options?: UseMutationOptions<unknown, unknown, ExternalAuthIssuerUpdateParams>
) {
  const { currentEnvironment } = useEnvironment();

  const { mutateAsync, ...rest } = useMutation({
    mutationFn: (args: ExternalAuthIssuerUpdateParams) =>
      updateExternalAuthIssuerUrls({ environment: currentEnvironment!, ...args }),
    ...options,
    onSuccess: async (data, variables, ctx) => {
      options?.onSuccess?.(data, variables, ctx);
    },
  });

  return {
    ...rest,
    addExternalAuthIssuerUrls: mutateAsync,
  };
}
