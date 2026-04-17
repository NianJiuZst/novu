import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { InlineToast } from '@/components/primitives/inline-toast';
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
      <div className="shrink-0 py-2.5">
        <InlineToast
          variant="tip"
          className="w-full shadow-none"
          title="Read-only"
          description="Editing is available in development."
          ctaLabel={switchAction?.label}
          onCtaClick={switchAction?.onClick}
          ctaClassName="text-foreground-600 hover:text-foreground-950"
        />
      </div>
      <div className="min-h-0 flex-1 select-text overflow-auto" inert>
        {children}
      </div>
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
