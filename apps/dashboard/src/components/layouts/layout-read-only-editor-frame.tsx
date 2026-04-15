import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReadOnlyStepEditorFrame } from '@/components/workflow-editor/steps/read-only-step-editor';
import { useEnvironment } from '@/context/environment/hooks';
import { buildRoute, ROUTES } from '@/utils/routes';
import { useLayoutEditor } from './layout-editor-provider';

type LayoutReadOnlyEditorFrameProps = {
  children: ReactNode;
  className?: string;
};

export function LayoutReadOnlyEditorFrame(props: LayoutReadOnlyEditorFrameProps) {
  const { children, className } = props;
  const navigate = useNavigate();
  const { switchEnvironment, oppositeEnvironment } = useEnvironment();
  const { layout } = useLayoutEditor();
  const developmentEnvironment = oppositeEnvironment?.name === 'Development' ? oppositeEnvironment : null;

  const handleSwitchToDevelopment = () => {
    if (!developmentEnvironment?.slug || !layout?.layoutId) {
      return;
    }

    switchEnvironment(developmentEnvironment.slug);
    navigate(
      buildRoute(ROUTES.LAYOUTS_EDIT, {
        environmentSlug: developmentEnvironment.slug,
        layoutSlug: layout.layoutId,
      })
    );
  };

  return (
    <ReadOnlyStepEditorFrame
      className={className}
      switchAction={
        developmentEnvironment
          ? {
              label: `Switch to ${developmentEnvironment.name}`,
              onClick: handleSwitchToDevelopment,
            }
          : undefined
      }
    >
      {children}
    </ReadOnlyStepEditorFrame>
  );
}
