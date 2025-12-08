import { RiRouteFill } from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';
import { STEP_TYPE_TO_ICON } from '@/components/icons/utils';
import { DiscoverWorkflowOutput } from '@/types/studio';
import { StepTypeEnum } from '@/utils/enums';
import { buildRoute, ROUTES } from '@/utils/routes';
import { cn } from '@/utils/ui';

type StudioWorkflowCardProps = {
  workflow: DiscoverWorkflowOutput;
};

const stepTypeMap: Record<string, StepTypeEnum> = {
  email: StepTypeEnum.EMAIL,
  in_app: StepTypeEnum.IN_APP,
  sms: StepTypeEnum.SMS,
  chat: StepTypeEnum.CHAT,
  push: StepTypeEnum.PUSH,
  digest: StepTypeEnum.DIGEST,
  delay: StepTypeEnum.DELAY,
  throttle: StepTypeEnum.THROTTLE,
  custom: StepTypeEnum.CUSTOM,
};

export function StudioWorkflowCard({ workflow }: StudioWorkflowCardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    const searchParams = new URLSearchParams(location.search);
    navigate({
      pathname: buildRoute(ROUTES.STUDIO_WORKFLOW, { workflowId: workflow.workflowId }),
      search: searchParams.toString(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'bg-background hover:bg-neutral-alpha-50 border-neutral-alpha-200 group flex cursor-pointer flex-col gap-3 rounded-lg border p-4 text-left transition-colors'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-neutral-alpha-100 flex size-8 items-center justify-center rounded-lg">
            <RiRouteFill className="text-foreground-600 size-4" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-foreground-950 text-sm font-medium">{workflow.name || workflow.workflowId}</h3>
            <p className="text-foreground-400 text-xs">{workflow.workflowId}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-foreground-600 text-xs">{workflow.steps.length} steps</span>
        {workflow.steps.length > 0 && (
          <>
            <span className="text-foreground-400 text-xs">·</span>
            <div className="flex items-center gap-1">
              {workflow.steps.slice(0, 3).map((step, index) => {
                const stepType = stepTypeMap[step.type] || StepTypeEnum.CUSTOM;
                const Icon = STEP_TYPE_TO_ICON[stepType];

                return (
                  <div key={index} className="text-foreground-400 flex size-4 items-center justify-center">
                    <Icon className="size-3.5" />
                  </div>
                );
              })}
              {workflow.steps.length > 3 && (
                <span className="text-foreground-400 text-xs">+{workflow.steps.length - 3}</span>
              )}
            </div>
          </>
        )}
      </div>
    </button>
  );
}
