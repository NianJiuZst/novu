import { EnvironmentTypeEnum, type UiSchema } from '@novu/shared';

import { getComponentByType } from '@/components/workflow-editor/steps/component-utils';
import { TabsSection } from '@/components/workflow-editor/steps/tabs-section';
import { useEnvironment } from '@/context/environment/hooks';

import { WorkflowReadOnlyStepEditor } from '../read-only-step-editor';

type PushEditorProps = { uiSchema: UiSchema };

export const PushEditor = (props: PushEditorProps) => {
  const { currentEnvironment } = useEnvironment();
  const { uiSchema } = props;
  const { body, subject } = uiSchema?.properties ?? {};

  const pushFields = (
    <div className="flex h-full flex-col">
      <TabsSection className="p-0 pb-3">
        <div className="rounded-12 flex flex-col gap-2 border border-neutral-100 p-2 bg-bg-weak">
          {getComponentByType({ component: subject.component })}
          {getComponentByType({ component: body.component })}
        </div>
      </TabsSection>
    </div>
  );

  if (currentEnvironment?.type !== EnvironmentTypeEnum.DEV) {
    return <WorkflowReadOnlyStepEditor>{pushFields}</WorkflowReadOnlyStepEditor>;
  }

  return pushFields;
};
