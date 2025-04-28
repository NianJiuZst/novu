import { Step, StepProps } from '@/components/primitives/step';
import { IconType } from 'react-icons/lib';
import { STEP_TYPE_TO_ICON } from './icons/utils';
import { ComponentProps } from 'react';
import { StepTypeEnum } from '@novu/api/models/components';

type WorkflowStepProps = StepProps & {
  step: StepTypeEnum;
};

const stepRenderData: Record<StepTypeEnum, { variant: ComponentProps<typeof Step>['variant']; icon: IconType }> = {
  [StepTypeEnum.Chat]: { variant: 'feature', icon: STEP_TYPE_TO_ICON[StepTypeEnum.Chat] },
  [StepTypeEnum.Custom]: { variant: 'alert', icon: STEP_TYPE_TO_ICON[StepTypeEnum.Custom] },
  [StepTypeEnum.Delay]: { variant: 'warning', icon: STEP_TYPE_TO_ICON[StepTypeEnum.Delay] },
  [StepTypeEnum.Digest]: { variant: 'highlighted', icon: STEP_TYPE_TO_ICON[StepTypeEnum.Digest] },
  [StepTypeEnum.Email]: { variant: 'information', icon: STEP_TYPE_TO_ICON[StepTypeEnum.Email] },
  [StepTypeEnum.InApp]: { variant: 'stable', icon: STEP_TYPE_TO_ICON[StepTypeEnum.InApp] },
  [StepTypeEnum.Push]: { variant: 'verified', icon: STEP_TYPE_TO_ICON[StepTypeEnum.Push] },
  [StepTypeEnum.Sms]: { variant: 'destructive', icon: STEP_TYPE_TO_ICON[StepTypeEnum.Sms] },
  [StepTypeEnum.Trigger]: { variant: 'neutral', icon: STEP_TYPE_TO_ICON[StepTypeEnum.Trigger] },
};

export const WorkflowStep = (props: WorkflowStepProps) => {
  const { step, ...rest } = props;
  const Icon = stepRenderData[step].icon;

  return (
    <Step variant={stepRenderData[step].variant} {...rest}>
      <Icon />
    </Step>
  );
};
