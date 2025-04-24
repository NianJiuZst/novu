import { createWorkflow } from '@/api/workflows';
import { useEnvironment } from '@/context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';
import { buildRoute, ROUTES } from '@/utils/routes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { workflowSchema } from '../components/workflow-editor/schema';
import { showErrorToast, showSuccessToast } from '../components/workflow-editor/toasts';
import { useState } from 'react';
import { CreateWorkflowDto, WorkflowCreationSourceEnum } from '@novu/api/models/components';

interface UseCreateWorkflowOptions {
  onSuccess?: () => void;
}

export function useCreateWorkflow({ onSuccess }: UseCreateWorkflowOptions = {}) {
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

      showSuccessToast(toastId);
      navigate(
        buildRoute(ROUTES.EDIT_WORKFLOW, {
          environmentSlug: currentEnvironment?.slug ?? '',
          workflowSlug: result.slug ?? '',
        })
      );

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
      source: template?.source ?? WorkflowCreationSourceEnum.Dashboard,
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
