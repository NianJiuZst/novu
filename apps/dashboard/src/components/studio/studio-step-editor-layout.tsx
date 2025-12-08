import type { ExecuteOutput } from '@novu/framework/internal';
import { DiscoverStepOutput } from '@/types/studio';
import { StudioStepControls } from './studio-step-controls';
import { StudioStepPreview } from './studio-step-preview';

type StudioStepEditorLayoutProps = {
  step: DiscoverStepOutput;
  controls: Record<string, unknown>;
  onControlsChange: (controls: Record<string, unknown>) => void;
  preview?: ExecuteOutput;
  isPreviewPending: boolean;
  isPreviewError: boolean;
};

export function StudioStepEditorLayout({
  step,
  controls,
  onControlsChange,
  preview,
  isPreviewPending,
  isPreviewError,
}: StudioStepEditorLayoutProps) {
  return (
    <div className="grid h-full w-full grid-cols-2 divide-x">
      <div className="flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <h2 className="text-foreground-950 text-sm font-semibold">Configure Step</h2>
          <p className="text-foreground-600 text-xs">Adjust step controls and see live preview</p>
        </div>
        <div className="flex-1 overflow-auto">
          <StudioStepControls schema={step.controls.schema} formData={controls} onChange={onControlsChange} />
        </div>
      </div>
      <div className="flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <h2 className="text-foreground-950 text-sm font-semibold">Preview</h2>
          <p className="text-foreground-600 text-xs">Live preview of your step</p>
        </div>
        <div className="flex-1 overflow-auto">
          <StudioStepPreview
            stepType={step.type}
            preview={preview}
            isPending={isPreviewPending}
            isError={isPreviewError}
          />
        </div>
      </div>
    </div>
  );
}
