import { type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteWorkflow } from "@/api/workflows";
import { useEnvironment } from "@/context/environment/hooks";
import { QueryKeys } from "@/utils/query-keys";
import type { OmitEnvironmentFromParameters } from "@/utils/types";

type DeleteWorkflowParameters = OmitEnvironmentFromParameters<typeof deleteWorkflow>;

export const useDeleteWorkflow = (options?: UseMutationOptions<void, unknown, DeleteWorkflowParameters>) => {
	const queryClient = useQueryClient();
	const { currentEnvironment } = useEnvironment();

	const { mutateAsync, ...rest } = useMutation({
		mutationFn: (args: DeleteWorkflowParameters) => deleteWorkflow({ environment: currentEnvironment!, ...args }),
		...options,
		onSuccess: async (data, variables, ctx) => {
			await queryClient.invalidateQueries({
				queryKey: [QueryKeys.fetchWorkflows],
			});

			options?.onSuccess?.(data, variables, ctx);
		},
	});

	return {
		...rest,
		deleteWorkflow: mutateAsync,
	};
};
