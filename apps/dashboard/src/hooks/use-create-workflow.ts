import { createWorkflow } from '@/api/workflows';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';
import { buildRoute, ROUTES } from '@/utils/routes';
import { type CreateWorkflowDto, WorkflowCreationSourceEnum } from '@novu/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { workflowSchema } from '../components/workflow-editor/schema';
import { showErrorToast, showSuccessToast } from '../components/workflow-editor/toasts';

interface UseCreateWorkflowOptions {
  onSuccess?: () => void;
  preventNavigation?: boolean;
  suppressToast?: boolean;
}

export function useCreateWorkflow({ onSuccess, preventNavigation, suppressToast }: UseCreateWorkflowOptions = {}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentEnvironment } = useEnvironment();
  const [toastId] = useState<string | number>('');

  const mutation = useMutation({
    mutationFn: async (workflow: CreateWorkflowDto) => createWorkflow({ environment: currentEnvironment!, workflow }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [QueryKeys.fetchWorkflows, currentEnvironment?._id] });
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.fetchTags, currentEnvironment?._id],
      });

      if (!suppressToast) {
        showSuccessToast(toastId);
      }

      if (!preventNavigation) {
        navigate(
          buildRoute(ROUTES.EDIT_WORKFLOW, {
            environmentSlug: currentEnvironment?.slug ?? '',
            workflowSlug: result.data.slug ?? '',
          })
        );
      }

      onSuccess?.();
    },

    onError: (error) => {
      showErrorToast(toastId, error);
    },
  });

  const submit = (values: z.infer<typeof workflowSchema>, template?: CreateWorkflowDto) => {
    return mutation.mutateAsync({
      name: values.name,
      steps: template?.steps ?? [],
      __source: template?.__source ?? WorkflowCreationSourceEnum.DASHBOARD,
      workflowId: values.workflowId,
      description: values.description || undefined,
      tags: values.tags || [],
    });
  };

  return {
    submit,
    isLoading: mutation.isPending,
  };
}
