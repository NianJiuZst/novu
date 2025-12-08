import { ReactNode } from 'react';
import { WorkflowProvider } from '@/components/workflow-editor/workflow-provider';
import { WorkflowSchemaProvider } from '@/components/workflow-editor/workflow-schema-provider';
import { EnvironmentProvider } from '@/context/environment/environment-provider';
import { DiscoverStepOutput, DiscoverWorkflowOutput } from '@/types/studio';

type StudioWorkflowSchemaProviderProps = {
  children: ReactNode;
  workflow: DiscoverWorkflowOutput;
  step: DiscoverStepOutput;
};

export function StudioWorkflowSchemaProvider({ children, workflow, step }: StudioWorkflowSchemaProviderProps) {
  const mockWorkflow = {
    ...workflow,
    workflowId: workflow.workflowId,
    slug: workflow.workflowId,
    payloadSchema: workflow.payload?.schema,
    validatePayload: false,
    steps: [],
  } as any;

  const mockStep = {
    ...step,
    stepId: step.stepId,
    _id: step.stepId,
    name: step.stepId,
    type: step.type,
    controls: {
      dataSchema: step.controls.schema,
      uiSchema: {},
      values: {},
    },
  } as any;

  return (
    <EnvironmentProvider>
      <WorkflowProvider workflow={mockWorkflow} step={mockStep}>
        <WorkflowSchemaProvider>{children}</WorkflowSchemaProvider>
      </WorkflowProvider>
    </EnvironmentProvider>
  );
}
