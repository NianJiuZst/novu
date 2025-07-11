import type { ILayoutEntity, IResponseError } from '@novu/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLayout, getLayoutById, updateLayoutById } from '../api/layouts';
import { QueryKeys } from '../api/query.keys';

export function useLayoutsEditor(id: string) {
  const queryClient = useQueryClient();
  const { mutateAsync: createNewLayout, isLoading: isLoadingCreate } = useMutation(createLayout, {
    onSuccess: () => {
      queryClient.refetchQueries([QueryKeys.changesCount]);
    },
  });

  const { mutateAsync: updateLayout, isLoading: isLoadingUpdate } = useMutation<
    ILayoutEntity,
    IResponseError,
    { layoutId: string; data: any }
  >(({ layoutId, data }) => updateLayoutById(layoutId, data), {
    onSuccess: () => {
      queryClient.refetchQueries([QueryKeys.changesCount]);
    },
  });

  const { data: layout, isLoading: isLoadingLayout } = useQuery<ILayoutEntity>(
    [QueryKeys.getLayoutById, id],
    () => getLayoutById(id),
    {
      enabled: !!id,
    }
  );

  return {
    layout,
    isLoading: (!!id && isLoadingLayout) || isLoadingCreate || isLoadingUpdate,
    createNewLayout,
    updateLayout,
  };
}
