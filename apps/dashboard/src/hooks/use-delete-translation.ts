import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTranslation } from "@/api/translations";
import { useEnvironment } from "@/context/environment/hooks";
import { QueryKeys } from "@/utils/query-keys";
import type { OmitEnvironmentFromParameters } from "@/utils/types";

type DeleteTranslationParameters = OmitEnvironmentFromParameters<typeof deleteTranslation>;

export const useDeleteTranslation = () => {
	const { currentEnvironment } = useEnvironment();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (args: DeleteTranslationParameters) => deleteTranslation({ environment: currentEnvironment!, ...args }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: [QueryKeys.fetchTranslationGroups],
				exact: false,
			});

			await queryClient.invalidateQueries({
				queryKey: [QueryKeys.fetchTranslations, currentEnvironment?._id],
				exact: false,
			});
		},
	});
};
