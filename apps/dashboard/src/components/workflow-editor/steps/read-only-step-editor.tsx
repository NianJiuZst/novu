import type { ReactNode } from 'react';
import { RiArrowRightSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/primitives/button';
import { useEnvironment } from '@/context/environment/hooks';
import { buildRoute, ROUTES } from '@/utils/routes';
import { cn } from '@/utils/ui';
import { useStepEditor } from './context/step-editor-context';

type ReadOnlyStepEditorFrameProps = {
  children: ReactNode;
  className?: string;
  switchAction?: {
    label: string;
    onClick: () => void;
  };
};

export function ReadOnlyStepEditorFrame(props: ReadOnlyStepEditorFrameProps) {
  const { children, className, switchAction } = props;

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="bg-bg-weak shrink-0 border-b border-neutral-100 px-3 py-2 text-xs text-neutral-600">
        <p className="leading-relaxed">
          Step editing is only available in development environments. Switch to a development environment to modify this
          step.
        </p>
        {switchAction && (
          <div className="mt-2 flex justify-start">
            <Button
              variant="secondary"
              size="xs"
              mode="gradient"
              onClick={switchAction.onClick}
              trailingIcon={RiArrowRightSLine}
            >
              {switchAction.label}
            </Button>
          </div>
        )}
      </div>
      <div className="pointer-events-none min-h-0 flex-1 select-text overflow-auto">{children}</div>
    </div>
  );
}

type WorkflowReadOnlyStepEditorProps = {
  children: ReactNode;
  className?: string;
};

export function WorkflowReadOnlyStepEditor(props: WorkflowReadOnlyStepEditorProps) {
  const { children, className } = props;
  const navigate = useNavigate();
  const { switchEnvironment, oppositeEnvironment } = useEnvironment();
  const { workflow } = useStepEditor();
  const developmentEnvironment = oppositeEnvironment?.name === 'Development' ? oppositeEnvironment : null;

  const handleSwitchToDevelopment = () => {
    if (!developmentEnvironment?.slug) {
      return;
    }

    switchEnvironment(developmentEnvironment.slug);
    navigate(
      buildRoute(ROUTES.EDIT_WORKFLOW, {
        environmentSlug: developmentEnvironment.slug,
        workflowSlug: workflow.workflowId,
      })
    );
  };

  return (
    <ReadOnlyStepEditorFrame
      className={className}
      switchAction={
        developmentEnvironment
          ? { label: `Switch to ${developmentEnvironment.name}`, onClick: handleSwitchToDevelopment }
          : undefined
      }
    >
      {children}
    </ReadOnlyStepEditorFrame>
  );
}
