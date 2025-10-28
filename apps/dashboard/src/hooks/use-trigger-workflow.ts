import { IEnvironment } from '@novu/shared';
import { useMutation } from '@tanstack/react-query';
import { triggerWorkflow } from '@/api/workflows';
import { TelemetryEvent } from '@/utils/telemetry';
import { useEnvironment } from '../context/environment/hooks';
import { useTelemetry } from './use-telemetry';

export const useTriggerWorkflow = (environmentHint?: IEnvironment) => {
  const { currentEnvironment } = useEnvironment();
  const telemetry = useTelemetry();

  const { mutateAsync, isPending, error, data } = useMutation({
    mutationFn: async ({
      name,
      to,
      payload,
      context,
    }: {
      name: string;
      to: unknown;
      payload: unknown;
      context?: unknown;
    }) => {
      const result = await triggerWorkflow({
        environment: environmentHint ?? currentEnvironment ?? ({} as IEnvironment),
        name,
        to,
        payload,
        context,
      });

      if (result.data.transactionId) {
        telemetry(TelemetryEvent.WORKFLOW_TEST_TRIGGERED, {
          workflowId: name,
          transactionId: result.data.transactionId,
        });
      }

      return result;
    },
  });

  return {
    triggerWorkflow: mutateAsync,
    isPending,
    error,
    data,
  };
};
