import { StepTypeEnum } from '@novu/shared';

export const PROMPT_SUGGESTIONS_BY_STEP: Record<StepTypeEnum, string[]> = {
  [StepTypeEnum.EMAIL]: [
    'Write a friendly welcome email',
    'Create a password reset email',
    'Draft an order confirmation email',
    'Compose a weekly digest email',
  ],
  [StepTypeEnum.SMS]: [
    'Write a verification code SMS',
    'Create an order shipped SMS',
    'Draft a payment reminder SMS',
    'Compose an appointment reminder SMS',
  ],
  [StepTypeEnum.PUSH]: [
    'Write a new message push notification',
    'Create a deal alert push notification',
    'Draft a reminder push notification',
    'Compose a news update push notification',
  ],
  [StepTypeEnum.IN_APP]: [
    'Write a welcome in-app notification',
    'Create a feature announcement notification',
    'Draft a task reminder notification',
    'Compose a milestone celebration notification',
  ],
  [StepTypeEnum.CHAT]: [
    'Write a welcome chat message',
    'Create an order update chat message',
    'Draft a support response chat message',
    'Compose a follow-up chat message',
  ],
  [StepTypeEnum.DIGEST]: [],
  [StepTypeEnum.TRIGGER]: [],
  [StepTypeEnum.DELAY]: [],
  [StepTypeEnum.THROTTLE]: [],
  [StepTypeEnum.CUSTOM]: [],
};

